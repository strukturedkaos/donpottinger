---
title: "Bye Bye Heroku, Hello Dokku: Migrating a Rails App from Heroku to Dokku (Part 2)"
date: November 22, 2014
tags: Dokku, Heroku, DigitalOcean, Postgres, Redis, Elasticsearch, SSL, Rails, Migrating data, TLS
published: true
---

In the [Part 1](/blog/2014/11/17/bye-bye-heroku-hello-dokku.html), we successfully setup a Dokku-deployed DigitalOcean-powered Rails app with Postgres, Redis, Elasticsearch and Sidekiq.

In this post, I'll show you how to setup SSL/TLS, schedule background jobs, and migrate your data from Heroku.

### SSL

On Heroku, I used the [SSL Endpoint add-on](https://addons.heroku.com/ssl) for enabling SSL. Setting up SSL for your app is just as easy with Dokku. First, SSH into your DigitalOcean droplet, navigate to your app's directory and create a directory called ``tls``.

```shell
cd ~/dokku/appname
mkdir tls
```

Then copy the ``server.crt`` and ``server.key`` files to the ``tls`` folder. I did this by using SCP to copy the files from my local machine to the server.

```shell
scp server.crt root@yourdomain.com:/home/dokku/appname/tls
scp server.key root@yourdomain.com:/home/dokku/appname/tls
```

You'll need to reload nginx in order for the TLS configurationt to be applied.

```shell
nginx -s reload
```

For more instructions on setting up SSL/TLS for all of your applications, check out the [Dokku documentation](http://progrium.viewdocs.io/dokku/nginx)

### Scheduled Jobs

The [Heroku Scheduler](https://addons.heroku.com/scheduler) add-on provided a rudimentary way to run jobs on your app at scheduled time intervals, much like cron in a traditional server environment.

After some research, I decided to replace Heroku Scheduler with a gem called [Clockwork](https://github.com/tomykaira/clockwork), which "runs a lightweight, long-running Ruby process...to schedule recurring work[jobs] at particular times or dates."

Add the ``clockwork`` gem to your Gemfile and run ``bundle install``:

```
# Scheduling jobs
gem 'clockwork'
```

Create a clock.rb and define the schedule of your jobs:

```ruby
# lib/clock.rb

require File.expand_path('../../config/boot',        __FILE__)
require File.expand_path('../../config/environment', __FILE__)
require 'clockwork'

include Clockwork

every(1.day, 'Run my worker daily', at: '04:30', tz: 'UTC') { Sidekiq::Client.enqueue(MyWorker) }
every(7.day, 'Send weekly reports', at: '02:00', tz: 'UTC') { Sidekiq::Client.enqueue(ReportWorker) }
```

Add the clockwork process your Procfile:

```shell
web: bundle exec puma --preload -t ${PUMA_MIN_THREADS:-0}:${PUMA_MAX_THREADS:-16} -w ${PUMA_WORKERS:-1} -p $PORT -e $RACK_ENV
clock: bundle exec clockwork lib/clock.rb
```

_This last step is important since Dokku runs only the web process in the Procfile by default._

On your server, install the [dokku-logging-supervisord plugin](https://github.com/sehrope/dokku-logging-supervisord):

> It will run all process types (web, worker, etc.) and will restart crashed applications.

> Additionally, it creates and binds a shared directory for each app from /var/log/dokku/$APP on the host machine to /var/log/app in the app's container. The supervisord config is setup to have each process in your Procfile send it's stdout and stderr to a separate file in that directory named $PROCESS_NAME.$PROCESS_NUM.log. Output for the supervisord process itself (startup/shutdown notices, etc) will be logged to a file named supervisor.log in the same log directory.

```shell
git clone https://github.com/sehrope/dokku-logging-supervisord.git /var/lib/dokku/plugins/logging-supervisord
dokku plugins-install
```

Finally, commit your changes and push your app:

```shell
git push dokku@yourdomain.com:appname master
```

### Migrating Postgres Data

Put the Heroku app in maintenance mode to prevent further changes to the data and capture a backup of the Postgres database using Heroku's PGBackups add-on:

```shell
heroku maintenance:on --remote production
heroku pgbackups:capture --expire --remote production
```

After the backup is captured, copy the URL for the backup:

```shell
heroku pgbackups:url --remote production
```

On your server, navigate to the app's directory, download the backup and import the backup dump into your Dokku app's database:

```shell
cd /home/dokku/appname
curl -o latest.dump "https://s3.amazonaws.com/hkpgbackups/app46@heroku.com/b905.dump"
dokku postgresql:restore sport < latest.sql
```

#### Migrating Redis Data

Unfortunately, I wasn't able to successfully migrate Redis data from the RedisToGo. However, I'll document
it in case it works for someone else, or if someone knows what I did wrong.

Since I was using RedisToGo, I copied the URL for a backup from the Backups section on the RedisToGo dashboard. On the server, copy the host IP address for your app's Redis container:


```shell
# dokku redis:info appname

       Host: 172.17.0.12
       Public port: 32120
```

Then download and save the backup from RedisToGo:


```shell
curl -o backup.rdb "http://s3.amazonaws.com/redistogo-backups/231/2014-11-17T00:58:27.rdb"
```

Import the backup with the following command:

```shell
redis-cli -h 172.17.0.12 < backup.rdb
```

During the import, I ended up getting the following errors that just kept repeating:

```shell
(error) ERR unknown command ')'
(error) ERR unknown command ')'
(error) ERR unknown command ')'
```

#### Wrapping Up

We've successfully setup SSL/TLS and no longer need the SSL Endpoint add-on, replaced Heroku Scheduler with scheduled jobs using the Clockwork gem, and migrated data from Heroku's Postgres add-on to our instance of Postgres on our server. If anyone has a solution for migrating the Redis data, please share in the comments below.

