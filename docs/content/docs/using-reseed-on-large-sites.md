---
date: 2022-10-12T00:00:00Z
title: Using Reseed on Large Sites
nav_title: Large sites
nav_section: Usage
weight: 4
---
If your site has a large number of files, you may wish to break up the `reseed` process into smaller steps.

This can be achieved using the `--split` and `--partition` options. See the options documentation for extra information.

### Example

Consider the following command:

```shell
npx reseed -s public/ -b blog/ -d site/ --split 4 --partition 1
```

This will logically split the files in `public/` into four equal partitions. I then specify which of the four partitions to process using the `--partition` option - in this case, the first.

By running the command above three more times, increasing `--partition` by one each time, all of my site files will be processed.

> Reseed processes files in the same order every run, so the split is "stable" - files will always be in the same partition for any given split.