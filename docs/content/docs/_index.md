---
title: Getting Started
nav_title: Getting Started
nav_section: Root
weight: 2
---
Reseed should be run after your static site build (for example, using Hugo, Jekyll or Eleventy). It processes your&nbsp;*built*&nbsp;site, so take note of where your build step outputs to. This is often a folder like `public/`.

Say you have a blog that you want to serve on a subdomain of your domain (e.g. `mydomain.com`). For this example:

* Your Static Site Generator has built your site, and has output it to a folder named `public/`
* You want your blog to exist on the `/blog/` subdomain of your main site (e.g. `mydomain.com/blog/`)
* You would like the output of reseed to be placed in a folder named site/

To acheive this, first `cd` to your site files in your terminal. Then, run the following command:

```shell
npx reseed -s public/ -b blog/ -d site/
```

After running, your `reseed`ed files will be in a folder structure: `site/blog/`.

You can then deploy this to your subdomain.

&nbsp;