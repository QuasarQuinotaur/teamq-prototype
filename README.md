# Project Setup and Contribution Guide

Welcome to the repository! Follow these instructions to get your local environment running and to understand our branching strategy.
Theron Boozer, Norah Anderson
---

## Getting Started

### 1. Clone the Repository (or just do through Webstorm)
First, clone the repo to your local machine:
```bash
git clone git@github.com:QuasarQuinotaur/hanover.git
cd hanover
```

### 2. Install Dependencies
We use **pnpm** as our package manager. If you don't have it installed, you can get it via `npm install -g pnpm`.
```bash
pnpm install
```

### 3. Switch to the Development Branch
Our workflow centers around the `dev` branch. Immediately after cloning, switch over:
```bash
git checkout dev
```

### 4. Run the Application
To start the local development server:
```bash
pnpm dev
```
you can then access the dev site by going to [localhost:5173](http://localhost:5173)

---

## Branching Strategy

To keep the codebase stable, we follow a specific branching structure:

* **`main`**: The pristine, production-ready branch. !! **Never** branch off or commit directly to `main` !!
* **`dev`**: The primary integration branch for all new features.
* **Feature Branches**: Individual branches created for specific tasks or bugs.

### Working on Features

> [!IMPORTANT]
> Always branch off of **`dev`**, not `main`.

#### Step 1: Create a Feature Branch
Ensure you are on `dev` and up to date, then create your new branch:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/YOUR-FEATURE-NAME
```

#### Step 2: Develop and Commit
As you work on your feature, make small, frequent commits. This makes it easier to track progress and undo specific changes if something goes wrong.

1.  **Stage your changes:** `git add .` (or specify individual files)
2.  **Commit with a clear message:** `git commit -m "Brief description of what you did"`
3.  **Repeat:** Continue this cycle until your feature is complete and ready for integration.

#### Step 3: Merge Your Changes
Once your work is complete and tested, merge it back into the `dev` branch:

1.  **Commit your changes:** `git commit -m "Add cool feature"`
2.  **Switch back to dev:** `git checkout dev`
3.  **Pull the latest dev changes:** `git pull origin dev`
4.  **Switch back to your feature:** `git checkout feature/YOUR-FEATURE-NAME`
5.  **Merge dev into your branch:** `git merge dev`
    * *Note: This is where you resolve any merge conflicts locally on your feature branch. Test your code one last time here to ensure the merge didn't break anything.*
6.  **Switch back to dev:** `git checkout dev`
7.  **Merge your feature into dev:** `git merge feature/YOUR-FEATURE-NAME`
8.  **Push the updated dev branch:** `git push origin dev`

Ben Reinherz