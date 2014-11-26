---
title: Cron Job for Postgres Backups with Dokku
date: November 25, 2014
tags: Dokku, Heroku, DigitalOcean, Postgres, Backup data, Scripting
published: true
---

Found [a script](https://gist.github.com/dommmel/f79d4d648517ef015682) that backs up Postgres data for a given Dokku app.

_Note: This script uses the [Dokku PG plugin](https://github.com/Kloadut/dokku-pg-plugin)._

Contents of the script (dokku-pg-backup):

```shell
#! /bin/bash

# directory to save backups in, must be rwx by postgres user
BASE_DIR="/var/backups/postgres"
YMD=$(date "+%Y-%m-%d")
DIR="$BASE_DIR/$YMD"
mkdir -p $DIR
cd $DIR

# make database backup
dokku postgresql:dump $1 | gzip -9 > "$DIR/db.out.gz"

# delete backup files older than 7 days
OLD=$(find $BASE_DIR -type d -mtime +7)
if [ -n "$OLD" ] ; then
        echo deleting old backup files: $OLD
        echo $OLD | xargs rm -rfv
fi
```

You can call the script for the app:

```shell
./dokku-pg-backup appname
```

To perform a daily backup, I placed the script in the ``/etc/cron.daily``.

_Note: I'm using Ubuntu, and per the [CronHowto docs](https://help.ubuntu.com/community/CronHowto), the script file cannot will not accept a file name containing a period. The cron job will silently fail._

[My fork of the gist](https://gist.github.com/strukturedkaos/09315ff2d70eaf294eae).

