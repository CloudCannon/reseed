---
date: 2022-10-12T00:00:00Z
title: Ignore certain URLs
nav_title: Ignoring URLs
nav_section: Usage
weight: 3
---
You can prevent reseed from processing specific URLs in your HTML files.&nbsp;

This is done by adding the `reseed-ignore`&nbsp;attribute to elements that you would like unchanged.

**Example:**

```html
<a href="/manual" reseed-ignore>Click me!</a>
```