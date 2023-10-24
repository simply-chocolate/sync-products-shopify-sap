﻿# sync-products-shopify-sap
Created by Jedikrigeren for simply-chocolate

Purpose of this script is to create and/or update products in Shopify & PCN using their APIs with the data entered in SAP.

Script looks for products where the fields below have the corresponding values:
  - `U_CCF_Web_Sync: Y`
  - `U_CCF_Web_SalesUOM: NOT NULL`

Will write error message in teams if the items is lacking the nescessairy data to get created in Shopify.
