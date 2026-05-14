# Project Overview

> Short description 
- Budget appropriately by keeping youur income and expenses all in one location.


## Project Name

> Name of app:
- FinanceTracker 


## Summary

> Quickly describing the purpose, problem being solved and the targeted audience
- The main objective of this app is for users to enter their income and expenses in order to budget appropriately over a period of time. Individuals of any social status and economical background may use this app since budgetting is an essential part of daily life that can be overlooked. 


## Priority of the Project

- Users must be able to enter their income and expenses. The dashboard should also serve a summary of those transactions


## Website Features

FinanceTracker will contain the following pages:
- Landing page
- Login page
- Signup page
- Income page
- Expenses page
- Dashboard page 

> Landing page
- 2 buttons will be displayed: one will redirect to the login page and the other button will redirect to the signup page

> Login page
- The login page will contain a form with the following fields: 
        - Email
        - Password

> Signup page
- The signup page will contain a form with the following fields: 
        - First name
        - Last name
        - Email
        - Phone number
        - Address
        - Province/State
        - Country (with the dropdown options of Canada or United States)
        - Password
        - Confirm password

> Income page
- An income form with the following elements:
        - Name of transaction
        - Category (with a dropwdown menu with the following options):
                - Investment
                - Job
                - Gift
                - Other
        - Amount of transaction 
        - Date of transaction
- Display the total amount income (in CAD or USD depending on the country selected at signup) and a list of recent income transactions entered


> Expenses page
- An income form with the following elements:
        - Name of transaction
        - Category (with a dropwdown menu with the following options):
                - Grocery
                - Insurance
                - Entertainment
                - Other
        - Amount of transaction 
        - Date of transaction
- Display the total amount of expenses (in CAD or USD depending on the country selected at signup) and a list of recent income transactions entered


> Dashboard page
- When the user logs in successfully, they will be redirected to their dashboard
- This page will display total income and expenses
- This page will also display visually with the help of a graph and a diagram the total income and expenses
- A section to display recent income and expenses separately with the help of a graph over the span of 7 days, 14 days, monthly and yearly
- A short form to quick-add an income or expense


## Other Features

> Navbar
- A navbar for the website. If the user is not signed in, it will contain the following: 
        - The name of the app displayed on the left side
        - Links to login or signup on the right side

- If the user is signed in, the navbar will contain the following
        - The name of the app displayed on the left side
        - A message titled "Welcome back, "First name of the user""

> Side bar
- A minimizable side bar that is displayed only once the user is signed in. The side bar will be displayed on the left side of the app

- The side bar will contain the following elements:
        - Link to the Dashboard page
        - Link to the Income page
        - Link to the Expenses page
        - Button to log out at the bottom of the side bar

***For mobile devices, the side bar will be displayed as a dropdown menu when clicking a hamburger toggler

> Footer
- The name of the app will be centered horizontally 


## Architecture & Tech stack

- Languages & frameworks: React, Express.js, Node.js
- Styling: Tailwind CSS + shadcn/ui (Tailwind-based component library)
- Databases & storage: Supabase (use Prisma to work along) 
<!-- Prisma for Supabase is what Mongoose is for MongoDB -->