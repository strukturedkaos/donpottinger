---
title: Take a Long Walk in Your Customer's Shoes
date: July 13, 2015
tags: entrepreneurship, customer discovery, simple solution, complexity, Kevy, eCommerce, JavaScript
published: true
---

![](http://simplelifestrategies.com/wp-content/uploads/2012/05/SIMPLE.png)

At a startup, every second counts. When a potential customer is interested in your product, you pounce, give them the special treatment and demonstrate the benefits of choosing the little startup that will treat them like a person instead of just a number. Once a customer signs up, the clock begins to tick. You have a very short window to demonstrate your product's value. The customer is expecting to see a return on their investment immediately with as little friction as possible.

At [Kevy](http://kevy.com), we help eCommerce companies know their customer better and generate more revenue. Our customers expect to see results quickly. In order to do so, we streamlined our on-boarding process to consist of only 2 calls. The first call is for an initial walk-through of how to use Kevy with the customer's main user, typically a marketer. The second call is with a Kevy engineer and someone from the customer's development team - we walk-through the implementation process required to get their eCommerce data flowing into Kevy. It's just placing a little bit of JavaScript on a few pages of their eCommerce store. It's a well-documented process, and in theory, it's easy to implement. At least I thought so.

Unfortunately, our recent customers didn't share the same sentiments. They were having trouble implementing the Kevy JavaScript. I wanted to see what all the fuss was about. So, I decided to implement the JavaScript myself for our next customer. I expected to be done in 15 minutes. Why not? I had built what I was implementing. Wrong. It took me 3 tedious hours. I felt the actual pain of my customer as I attempted to use my own product, and it was unbearable.

Throughout my implementation, I documented the gaps in the process and the areas of inefficiencies and duplication. There were 5 discrete steps - 4 steps too many. The next day, I wrote some code to reduce those 5 complex steps into 1 simple step. Consequentially, I had abstracted away the need for the customer to write any code to integrate Kevy with their eCommerce store. Now, it can be done with the simple click of a button. Furthermore, we no longer need that second call during on-boarding. That's something they will definitely appreciate.

We've been selling Kevy as easy to implement. Unfortunately, I hadn't realized how painful the implementation process was until I took a moment, well 3 hours, to walk in my customers' shoes. It proved to be a tremendously valuable exercise - after I felt their pain, I was incredibly motivated and equipped (through documentation and analysis) to find a simple solution.
