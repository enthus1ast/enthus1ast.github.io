# gristBox

## What
This [Grist](https://getgrist.com) widget displays a grid of numbers which can be used to fill or remove items from a choice  list.

We use this to fill "positions in a box".

It works "two ways" you can either click a postion in the grid, or just change the
choice list as normal.


![gridPut](/images/gridPut.png)
![gridGet](/images/gridGet.png)

The grid actually resembles a vial box:

![The Box](/images/box.jpg)



## Mappings

Mapping   | description
----------|-------------
direction | If something is filled or removed from the choice list, must match the query param "Put" or "Get"
position | the choice list that is filled.

## settings / query params

`example.org/pathToWidget/?get=Get&put=Put&width=4&height=4`

Param | default Value | description
------|---------------|------------
put   | "Put"         | put something onto a position, displayed green
get   | "Get"         | remove something from a position, displayed red
width | 9             | grid width
height| 9             | grid height


## Changelog


- 1.0.0