---
title: Bye Bye Heroku, Hello Dokku
date: 2014-11-17 18:07 EST
tags:

---

I've been wanting to transition [Body Boss](https://sport.bodybossfitness.com) from Heroku for a while now. We were spending about $150 / mo to use about 4 web dynos, Postgres, Elasticsearch, Redis and Heroku's SSL add-ons. Heroku had been good to us - it allowed us to focus our time and energy on building the product rather than DevOps.

However, the time had come to say good-bye because we weren't actively developing new features or pursuing new customers, so we needed to minimize costs to keep Body Boss profitable.

I knew that I wanted to move over to a cloud hosting service, and I thought it would be a great opportunity to give [DigitalOcean](https://www.digitalocean.com/) a try. They offer plans that are extremely affordable at $5 / mo, and it's super easy to set up.

Here's how I did it:

On server:

http://dev.housetrip.com/2014/07/06/deploy-rails-and-postgresql-app-to-dokku/

`ssh root@104.236.12.77`


# installing the plugin
cd /var/lib/dokku/plugins
git clone https://github.com/Kloadut/dokku-pg-plugin postgresql
dokku plugins-install

# Create and setup the db
dokku postgresql:create bodyboss

dokku postgresql:link bodyboss bodyboss



On Deployment machine:

git remote add dokku dokku@104.236.12.77:bodyboss


Copying SSH key:

cat ~/.ssh/id_rsa.pub | ssh root@104.236.12.77 "sudo sshcommand acl-add dokku Macbook"


Ran into issue after pushing ``git push dokku master``:

Command: 'set -o pipefail; curl --fail --retry 3 --retry-delay 1 --connect-timeout 3 --max-time 30 https://s3-external-1.amazonaws.com/heroku-buildpack-ruby/ruby-2.1.4.tgz -s -o - | tar zxf - ' failed unexpectedly:
 !
 !     gzip: stdin: unexpected end of file
 !     tar: Child returned status 1
 !     tar: Error is not recoverable: exiting now
 !

Tried increasing the timeout of the curl request by installing build-env plugin and adding ``export CURL_TIMEOUT=60`` and ``export CURL_CONNECT_TIMEOUT=30`` to ``nano /home/dokku/BUILD_ENV``

Ended up being fixed by pulling latest dokku buildstep to update ruby buildpack - ``docker pull progrium/buildstep``

Ran into issue with bundler causing instance to run out of memory during installation of gems. Seems that the job count of 4 was too high for my 512 MB instance. Upped to 1 GB - got a similar error "Cannot allocate memory - /tmp/build/vendor/ruby-2.1.4/bin/ruby extconf.rb  2>&1". Resized instance to 16GB instance and gems installed. Push was successful. Apparently if I had read further in the blog post that I was following it says that to avoid deploy issues that you need to increase the swap space.


Setting up Redis:

```bash
cd /var/lib/dokku/plugins
git clone https://github.com/luxifer/dokku-redis-plugin redis
dokku plugins-install

dokku redis:create bodyboss


Setting up Sidekiq:

```bash
cd /var/lib/dokku/plugins
git clone https://github.com/bigboxsoftware/dokku-sidekiq sidekiq
dokku plugins-install

dokku sidekiq:activate bodyboss
```


Setting up Memcached using separate fork:
```bash
cd /var/lib/dokku/plugins
git clone https://github.com/jlachowski/dokku-memcached-plugin memcached
dokku plugins-install
```

Got an error when I ran ``dokku memcached:create bodyboss`` - ``Link plugin not found... Did you install it from https://github.com/rlaneve/dokku-link?``

Had to install dokku-link plugin:

```
cd /var/lib/dokku/plugins
sudo git clone https://github.com/rlaneve/dokku-link.git link
```

Followed instructions here: https://www.digitalocean.com/community/tutorials/how-to-add-swap-on-ubuntu-12-04
 dd if=/dev/zero of=/swapfile bs=1024 count=1024000
 mkswap /swapfile
 swapon /swapfile

 cd ~/dokku
 git pull origin master
 make install
 docker pull progrium/buildstep:latest


 cd /var/lib/dokku/plugins
 git clone https://github.com/Kloadut/dokku-pg-plugin postgresql
 git clone https://github.com/luxifer/dokku-redis-plugin redis
 git clone https://github.com/bigboxsoftware/dokku-sidekiq sidekiq
 git clone https://github.com/rlaneve/dokku-link.git link
 git clone https://github.com/jlachowski/dokku-memcached-plugin memcached
 git clone https://github.com/jezdez/dokku-elasticsearch-plugin elasticsearch

 dokku postgresql:create sport
 dokku postgresql:link sport sport
 dokku redis:create sport
 dokku memcached:create sport
 dokku elasticsearch:create sport


 Client: git push dokku strukturedkaos/dokku:master

Server:
dokku run sport bundle exec rake db:migrate
dokku sidekiq:activate sport
dokku release sport
dokku deploy sport

FINAL FIX: DISABLED SSL WITH CONFIG.FORCE_SSL = FALSE

Restore database:

  heroku maintenance:on --remote production

  heroku pgbackups:capture --expire --remote production

  heroku pgbackups:url --remote production

 curl -o latest.dump "https://s3.amazonaws.com/hkpgbackups/app4637091@heroku.com/b905.dump?AWSAccessKeyId=AKIAJSCBEZJRDOTGNGZQ&Expires=1416175251&Signature=NKV8WAo23fmGmjue3YMKN56Y8QQ%3D"

 pg_restore latest.dump > latest.sql

 dokku postgresql:restore sport < latest.sql

Set up memcached:

Run dokku memcached:info sport to grab Host IP address and port.
dokku config:set sport MEMCACHED_URL=172.17.0.13:11211

Update production.rb to use MEMCACHED_URL environment variable`

Restore redis backup from Heroku:

Download backup from Redis-to-go

redis-cli -h ip < yourdump.rdb

Set up Elasticsearch:

Run ``dokku elasticsearch:info sport`` to grab Host IP address and port.
dokku config:set sport ELASTICSEARCH_URL=172.17.0.14:9200

SSL:

scp server.crt root@synappsdigital.com:/home/dokku/sport/tls
scp server.key root@synappsdigital.com:/home/dokku/sport/tls

Issues:

Ran into SSL issue - had to edit nginx.conf to include sport.bodybossfitness.com domain. Then reloaded nginx with ``nginx -s reload``

Scheduled jobs:
Gem 'clockwork'
Mixed with [dokku-logging-supervisord](https://github.com/sehrope/dokku-logging-supervisord)

Resources:
Deploy a Rails and PostgreSQL app to Dokku: http://dev.housetrip.com/2014/07/06/deploy-rails-and-postgresql-app-to-dokku/
Dokku + DigitalOcean = Your very own, cheap, Heroku clone!: http://reallybusywizards.com/dokku-digitalocean-your-very-own-cheap-heroku-clone/
My blog's tech stack: Pelican powered, Dokku deployed: https://launchbylunch.com/posts/2014/Jan/23/blog-tech-stack/#ssl
