[![Build Status](https://travis-ci.org/electronifie/accountifie-svc.svg)](https://travis-ci.org/electronifie/accountifie-svc)
[![npm version](https://badge.fury.io/js/accountifie-svc.svg)](https://www.npmjs.com/package/accountifie-svc)
[![GitHub stars](https://img.shields.io/github/release/electronifie/accountifie-svc.svg?style=social&label=Source)](https://github.com/electronifie/accountifie-svc)
<hr>

**To install:** `npm install accountifie-svc -g`  

**To run:** `PORT=5124 MONGO_URL=mongodb://localhost:27017/accountifie accountifie-server`

A REST ledger server with support for:

 - multiple ledgers
 - multi-day transactions
 - running balances
 - fetching ledger state at arbitrary point in time

Works best with [accountifie](https://github.com/electronifie/accountifie), a full-featured accounting and reporting frontend.  
