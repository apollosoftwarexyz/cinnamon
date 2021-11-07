---
title: Packaging
description: "Packaging information for Apollo Software's Cinnamon framework"
position: 30
category: Developers
---

<div class="page-description">
This page explains Cinnamon's packaging procedure, the rationale behind why 
we choose to package Cinnamon the way we do and a comparison between our 
approach and other common approaches to packaging a JavaScript/TypeScript 
framework.
</div>

When Cinnamon is packaged using `yarn build`,
[rollup.js](https://rollupjs.org/guide/en/) packages all the packages in
`packages/*` as well as any `node_modules` that are used by the framework
(which would be more or less all of them). These are bundled into a combined
`distributions/cinnamon/dist/index.cjs` file containing transpiled JavaScript
and a combined type definitions (`.d.ts`) file containing all the type
definitions for the project and its dependencies.

As a developer, packaging for release is as simple as:
```bash
# Perform pre-release checks (optional if you won't actually be
# ...preparing an npm release)
yarn prerelease

# Increase the version of the workspace and the distribution
# package by one patch version.
# (e.g., 0.0.1 -> 0.0.2)
yarn version:patch

# Run the build!
yarn build
```

## Explaining our approach to packaging JS/TS frameworks

We would like to note here that Cinnamon takes an unusual approach to 
dependency management in that *all of Cinnamon's dependencies* are bundled 
into Cinnamon's distribution package with the rest of Cinnamon.

This was a deliberate design decision that we feel holds, at least, the 
following main advantages this has over the typical approach of packaging a 
JS/TS framework:

- **More effective dependency locking**; for some reason, we find, Node 
  developers *insist* on either following not semver (semantic versioning) 
  for their packages and releasing minor/patch versions that break other 
  packages that rely on them - or just following semver and breaking them 
  anyway. By packing the dependencies into one file, we can guarantee that 
  when you install any version of Cinnamon, it will function correctly, and 
  you won't be stuck with dependency hell.
- **Security can actually be improved with no extra (or even less) work**; 
  there is an argument to be made that locking packages prevents people from 
  installing security packages in dependencies - however:
  - either you can't or don't need to modify Cinnamon to apply the necessary 
    patches (e.g., you'd just be updating your `package.json` to install the 
    patches were it not all bundled), in which case, you would only be able 
    to perform automatic updates with yarn or npm's audit tools (which we 
    can do anyway, by automatically releasing Cinnamon patches periodically 
    or when needed),  
  - or you can or must modify Cinnamon to apply the patches, in which case 
    the whole framework's version needs to be bumped anyway.  
  Overall, this means that by bundling everything and applying patches to 
    the whole of Cinnamon (most of which we can do automatically from our 
    end, saving you time and missed package versions), everyone using that 
    version of Cinnamon benefits from the patch - as opposed to every user 
    of Cinnamon bumping the versions themselves.
- **More efficient packing and minification**; by merging everything into 
  one file, we can perform 'minification' (the process of minimizing 
  JavaScript code by optimizing or essentially loss-less-ly compressing the 
  code) on that entire file. This is more efficient than, say, compressing 
  and/or g-zipping multiple files because it is done at build time and can 
  be used as-is (i.e., without later decompressing the files.)
- **Speed and performance increases**; rather than seeking across multiple 
  files and checking lots of manifests when downloading, only one file is 
  downloaded and checked - which would intuitively cause a slight speed 
  increase. This is most likely fairly marginal in the wild but worth 
  mentioning nonetheless to counter the idea that there would be a 
  performance decrease.

Additionally, with respect to concerns about package size or size wastage 
due to duplicate dependencies:

- you're unlikely to need to install a package that overlaps in 
  functionality with anything Cinnamon does, internally or externally &mdash;
  or at least the expectation is that you shouldn't, because Cinnamon should 
  or will expose that functionality to you from the framework. (in fact, if 
  Cinnamon has functionality internally that you need but which isn't 
  exposed, chances are we just assumed it wouldn't be useful to an end user, 
  and we encourage you to open a GitHub issue to let us know your use case!)
- Cinnamon's distribution package weighs in at roughly ~ 1 MB, which is 3x 
  less than a popular Cinnamon alternative aiming to provide similar 
  functionality - `sailsjs`!

> If you have any feedback - or would just like to open a discussion about 
> this, we'd be more than happy to hear what you think and provide details 
> on how we arrived at this decision. Please feel free to [open a GitHub 
> issue](https://github.com/apollosoftwarexyz/cinnamon/issues) or [create a 
> thread](https://github.com/apollosoftwarexyz/cinnamon/discussions/new) in 
> the Discussion tab (if there isn't one already).
