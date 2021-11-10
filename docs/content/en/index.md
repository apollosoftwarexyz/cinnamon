---
title: Prologue
description: 'Welcome to the Apollo Software Cinnamon Documentation.'
position: 1
---

<div class="page-description">
This is a quick overview of Cinnamon; why you should use it, our design 
goals, and our principles. This is our sales pitch to you. If you're already 
interested, feel free to skip this page and begin setting up Cinnamon!
</div>

<p style="text-align:center;font-size:24pt;font-weight:bold;">Cinnamon</p>

> _"The line of code that's the fastest to write, that never breaks, that
> doesn't need maintenance, is the line you never had to write."_

<alert type="info">
<p>
This documentation is fairly detailed, with an aim to explain most if not 
all notable aspects of the framework and, in some cases, provide insight into 
our design decisions.
</p>
<br>
<p>
With that said, we hope most of this is fairly intuitive, so, if you prefer 
less detailed documentation, we suggest you refer to the 'Basics' guides in 
the sidebar to get started and then simply experiment with Cinnamon... You can 
always refer back here for our guidance or insight into a feature!
</p>
</alert>

Cinnamon is a [TypeScript](https://www.typescriptlang.org) web application
framework inspired by [Nuxt.js](https://github.com/nuxt/nuxt.js) as a frontend
counterpart. With Cinnamon, our key aim is to achieve minimal code repetition
between projects to allow developers to focus on their application's business
logic and not boilerplate.

Cinnamon is designed for projects where your backend service is isolated 
from your frontend such as a mobile or single-page web application - meaning 
the backend is entirely data and business logic driven. Cinnamon APIs are
designed to be frontend agnostic and follow our _'one backend, many frontends'_
design philosophy for full stack software applications.

A full product system platform architecture (stack) involving Cinnamon might
look as follows:

<img src="/images/CinnamonStack-light.png" class="light-img" alt="Cinnamon Stack diagram" role="presentation" />
<img src="/images/CinnamonStack-dark.png" class="dark-img" alt="Cinnamon Stack diagram" role="presentation" />

