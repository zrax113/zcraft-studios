#!/usr/bin/env perl
use strict;
use warnings;

exec 'node', 'scripts/generate-site-index.js';
die "Could not run scripts/generate-site-index.js: $!";
