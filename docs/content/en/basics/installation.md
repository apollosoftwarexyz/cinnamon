---
title: Installation
description: "Setting up Apollo Software's Cinnamon framework."
position: 1
category: Basics
---

<div class="page-description">
This page demonstrates how to install Cinnamon's CLI globally and how to set 
up a new Cinnamon project.
</div>

## Prerequisites

- [node.js](https://nodejs.org/) - you should install the LTS version of 
  node.js.
- An IDE - we recommend either
  [Visual Studio Code](https://code.visualstudio.com/) or
  [WebStorm](https://www.jetbrains.com/webstorm/).

## Install Cinnamon's Command Line Interface (CLI)

You can globally install Cinnamon's CLI with the following command:

```bash
npm i -g @apollosoftwarexyz/cinnamon-cli
```

<alert>

If you encounter permission issues when installing global packages (e.g.,
you're installing Cinnamon on a machine you don't have root access to), you can
change `npm`'s default directory to a location you have permissions for:  

<br>

https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally#manually-change-npms-default-directory

</alert>

> We are investigating [`npx`](https://www.npmjs.com/package/npx) support for
> Cinnamon's CLI, however this is a command that you may use frequently as more
> functionality is added to the CLI, so it's worth installing as described
> above to avoid the overhead of `npx`.

## Set up your project

<badge>Coming Soon</badge>

```bash
# Initialize an empty project. You can optionally specify the
# project name after 'init'.
cinnamon init
```
