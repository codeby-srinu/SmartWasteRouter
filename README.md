# Smart Waste Collection Router 🚛

An AI-assisted waste collection routing system that predicts waste-bin fill levels and generates efficient collection routes.

## Overview

Traditional waste collection often follows fixed routes, which can result in unnecessary trips to bins that are not yet full.

This project combines Python-based prediction with Java data structures and algorithms to prioritize waste bins and generate efficient routes.

## Features

- Waste fill-level prediction using Python
- Priority-based bin selection
- Priority Queue / Heap
- Graph-based road representation
- A* pathfinding algorithm
- Java Object-Oriented Programming
- Dashboard using HTML and CSS
- Automated project execution using Python

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Waste fill prediction |
| Java | Core routing system |
| HTML | Dashboard structure |
| CSS | Dashboard styling |
| CSV | Data exchange |
| A* | Route optimization |
| Priority Queue | Bin prioritization |

## Architecture

```text
Historical Bin Data
        ↓
     Python
 Fill Prediction
        ↓
 predictions.csv
        ↓
      Java
        ↓
 Priority Queue
        ↓
 Urgent Bins
        ↓
   Road Graph
        ↓
      A*
        ↓
 Optimized Route
        ↓
 Dashboard