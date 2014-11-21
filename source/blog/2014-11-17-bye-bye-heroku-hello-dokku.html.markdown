---
title: Bye Bye Heroku, Hello Dokku
date: November 17, 2014
tags: Dokku, Heroku, DigitalOcean
published: true
---

Building a web app? It's so easy to deploy using [Heroku](https://www.heroku.com/). Saving time and effort by using Heroku, a cloud platform as a service (PaaS), allowed us to focus our time and energy on building the product. Heroku had been good to us, but we were spending about $150 / mo using about 4 web dynos and the following add-ons:

 * [Heroku Postgres - Standard 0 Plan](https://addons.heroku.com/heroku-postgresql#standard-0)
 * [Bonsai Elasticsearch - Staging Plan at $10 / mo](https://addons.heroku.com/bonsai#staging)
 * [Redis-To-Go - Mini Plan at $9 / mo](https://addons.heroku.com/redistogo#mini)
 * [Heroku Scheduler - Free](https://addons.heroku.com/scheduler)
 * [SSL Endpoint at $20 / mo](https://addons.heroku.com/ssl)

Also, the app uses [Sidekiq](https://github.com/mperham/sidekiq) for processing background jobs.

The time had come to say good-bye to Heroku. We weren't actively developing new features or pursuing new customers, so minizing costs became a priority.

Moving to a cheaper cloud hosting service made sense, and I thought it would be a great opportunity to give [DigitalOcean](https://www.digitalocean.com/) a try. They offer plans that are extremely affordable at $5 / mo, and it's super easy to set up.

Now all I needed was a was an easy way to deploy the app. [Dokku](https://github.com/progrium/dokku). Dokku's describes itself as a "Docker powered mini-Heroku in around 100 lines of Bash". It delivers for the most part. It is still rough around the edges in some areas. I felt the pain of these edges when I ran into a few issues.

Below is a walkthrough how I made the switch, I've included the errors/issues that I ran to and solutions in case you run into similar issues.

### Register Domain and Set Nameservers

First things first, register a domain and setup your nameservers to point to your DNS provider of choice. I use and recommend [Namecheap](http://www.namecheap.com) and [DNSimple](https://dnsimple.com) respectively.

_Note: You can get away with not setting up a domain since your Dokku-deployed app will be accessible via an IP address and port. However, I ran into issues with deployment and accessing my app (502 Gateway errors), and since I wasn't familiar with Dokku, I spent far too much time incorrectly believing that the issue stemmed from the fact that I didn't have an actual domain._

### Create your DigitalOcean Droplet

Login to or create a DigitalOcean account. Create a Droplet. I made sure that the Droplet hostname matched my DNS, and I chose the 1 GB plan since the app can be memory intensive when running background jobs:

<img src="/blog/2014/11/17/bye-bye-heroku-hello-dokku/digitalocean_hostname.png" width="550px" height="300px" />

Select your region. Skip over the Available Settings. Under Select Image, choose the Dokku option under the Applications. As of this writing, it is Dokku v0.2.3 on 14.04 (w/ Docker 1.2.0).

<img src="/blog/2014/11/17/bye-bye-heroku-hello-dokku/digitalocean_app_selection.png" width="550px" height="300px" />

Last step on this page is to add your computer's SSH key, so you can easily log in. Finally, click Create Droplet.

### Configuring your Server and Updating Dokku

Once your droplet has been successfully created, SSH into it your server from you client machine:

```shell
ssh root@yourdomain.com
```

Once logged into your server, update Dokku to the lastest version:

```shell
cd ~/dokku
git pull origin master
make install
```

Dokku uses Buildstep to build applications using Heroku's buildpacks. Update to the latest supported buildpacks to avoid any build errors when deploying:

```shell
docker pull progrium/buildstep:latest
```

I ran into out of memory errors when deploying app. To avoid this, add swap space to your server. I followed the instructions [here](https://www.digitalocean.com/community/tutorials/how-to-add-swap-on-ubuntu-12-04). Here are the basic steps:

```shell
dd if=/dev/zero of=/swapfile bs=1024 count=1024000
mkswap /swapfile
swapon /swapfile
```

### Deploying your App

From your client machine, navigate to your app's project folder and add Dokku as a repo:

```shell
git remote add dokku dokku@yourdomain.com:appname
```

Then deploy your app like you would with Heroku:

```shell
git push dokku master
```

If you want to push a non-master branch to test things out, switch to that branch and run:

```shell
git push dokku branchname:master
```

If the app fails to deploy, and it's not immediately clear why, hope over to your server and create a file ``/home/dokku/dokkurc`` that contains the following:

```shell
export DOKKU_TRACE=1
```

If your app successfully deployed, it's time to install _ALL_ the plugins!

### Installing Dokku Plugins

Dokku offers plugins that serve as replacements to Heroku add-ons. Some plugins require the app to be deployed before being able to complete installation. For Body Boss, I installed the Dokku plugins for Postgres, Redis, Elasticsearch, Memcached, and Sidekiq:

```shell
cd /var/lib/dokku/plugins
git clone https://github.com/Kloadut/dokku-pg-plugin postgresql
git clone https://github.com/luxifer/dokku-redis-plugin redis
git clone https://github.com/bigboxsoftware/dokku-sidekiq sidekiq
git clone https://github.com/rlaneve/dokku-link.git link
git clone https://github.com/jlachowski/dokku-memcached-plugin memcached
git clone https://github.com/jezdez/dokku-elasticsearch-plugin elasticsearch
dokku plugins-install
```

_Note: I initially attempted to install the memcached plugin with the dokku-link plugin, but I received an error: ``Link plugin not found... Did you install it from https://github.com/rlaneve/dokku-link?``_

#### Postgres

Once the plugins have been installed, create the Postgres database and link it to your app.


```shell
dokku postgresql:create dbname
dokku postgresql:link dbname appname
```

Finally, migrate the database:

```shell
dokku run appname bundle exec rake db:migrate
```

#### Redis

Create your Redis container and link the app to the container. The should set a ``REDIS_URL`` environment variable as an application environment variable:

```shell
dokku redis:create containername
dokku redis:link containername appname
```

If you run into issues (like I did) with the Redis plugin not setting the ``REDIS_URL`` environment variable, you can do it manually:


```shell
dokku redis:info containername

       Host: 172.23.0.13
       Public port: 43191

```

Copy the Host IP address and append the standard 6379 port for Redis. Set the ``REDIS_URL`` environment variable for your app:

```shell
dokku config:set appname REDIS_URL=redis://172.23.0.13:6379
```

#### Elasticsearch

Create your Elasticsearch container and link the app to the container. The should set a ``ELASTICSEARCH_URL`` environment variable as an application environment variable:

```shell
dokku elasticsearch:create containername
dokku elasticsearch:link containername appname
```

Like Redis, if you run into issues the ``ELASTICSEARCH_URL`` environment variable not being set, you can do it manually:


```shell
dokku elasticsearch:info containername

       Host: 172.19.0.21
       Private ports: 9200, 9300

```

Copy the Host IP address and append the standard 9200 port for Elasticsearch. Set the ``ELASTICSEARCH_URL`` environment variable for your app:

```shell
dokku config:set appname ELASTICSEARCH_URL=172.19.0.21:9200
```

#### Memcached

Setting up Memcached was a bit different for me since I had to setup the app to use a ``MEMCACHED_URL`` environment variable.

```shell
dokku memcached:create containername
dokku memcached:info containername

       Host: 172.17.1.3
       Gateway: 172.17.32.1
       Secret port: 11211
```

Set the ``MEMCACHED_URL`` environment variable:

```shell
dokku config:set appname MEMCACHED_URL=172.17.1.3:11211
```

Update the Rails app's production configuration to use the ``MEMCACHED_URL`` environment variable:

```ruby
# config/environments/production.rb

config.action_dispatch.rack_cache = {
  :metastore    => Dalli::Client.new(ENV['MEMCACHED_URL']),
  :entitystore  => 'file:tmp/cache/rack/body',
  :allow_reload => false
}

config.cache_store = :dalli_store, ENV['MEMCACHED_URL']
```

#### Sidekiq

Sidekiq was the easiest to setup:

```shell
dokku sidekiq:activate appname
```

#### Redeploy the App

If you've made it this far, then you are getting close! If you've made any changes to your app, make sure to push it again:

```shell
git push dokku master
```

If you have not made changes, just release and re-deploy the app:

```shell
dokku release appname
dokku deploy appname
```

You should be able to access your app via the URL provided by Dokku - http://appname.yourdomain.com.

In my next post, I'll show you how to setup SSL/TLS and migrate your data from Heroku to your brand new Dokku-deployed DigitalOcean-powered app!
