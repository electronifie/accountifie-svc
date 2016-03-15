COMPANIES="INC LLC F01"
DEBUG="info*,debug*,warn*,error*,test*,accountifie-svc*"
LOG_LEVEL=0
URL_BASE="http://localhost:5124"

run:
	DEBUG=$(DEBUG) \
	LOG_LEVEL=$(LOG_LEVEL) \
	./node_modules/.bin/supervisor bin/accountifie-svc | ./node_modules/.bin/bunyan -l $(LOG_LEVEL)

test:
	$(MAKE) DEBUG= LOG_LEVEL=20 test-cucumber test-mocha

docs:
	./node_modules/.bin/apidoc -o './docs' -i './lib'

test-json:
	DEBUG= LOG_LEVEL=100 ./node_modules/.bin/cucumber-js -f json:test-report.json

test-lpq:
	DEBUG= LOG_LEVEL=20 ./node_modules/.bin/cucumber.js --tags @low-priority-queue

test-gl:
	DEBUG= LOG_LEVEL=20 ./node_modules/.bin/cucumber.js --tags @general-ledger

test-cucumber:
	DEBUG=$(DEBUG) ./node_modules/.bin/cucumber-js

test-current:
	DEBUG=$(DEBUG) ./node_modules/.bin/cucumber.js -f pretty features* --tags @current

test-watch:
	hash watch-run 2>/dev/null || npm install watch-run -g
	watch-run -i -p '+(features|lib)/**' make test

test-mocha:
	DEBUG=$(DEBUG) ./node_modules/.bin/mocha test

take-snapshot:
	curl -X POST '$(URL_BASE)/gl/$(COMPANY)/take-snapshot' | ./node_modules/.bin/underscore pretty

take-snapshot-multi:
	for COMPANY in $(COMPANIES); do COMPANY=$$COMPANY $(MAKE) take-snapshot; done;

create-company:
	curl -X POST '$(URL_BASE)/gl/$(COMPANY)/create' | ./node_modules/.bin/underscore pretty

create-company-multi:
	for COMPANY in $(COMPANIES); do COMPANY=$$COMPANY $(MAKE) create-company; done;

disable-cache:
	curl -X POST '$(URL_BASE)/gl/$(COMPANY)/disable-balance-cache' | ./node_modules/.bin/underscore pretty

disable-cache-multi:
	for COMPANY in $(COMPANIES); do COMPANY=$$COMPANY $(MAKE) disable-cache; done;

enable-cache:
	curl -X POST '$(URL_BASE)/gl/$(COMPANY)/enable-balance-cache' | ./node_modules/.bin/underscore pretty

enable-cache-multi:
	for COMPANY in $(COMPANIES); do COMPANY=$$COMPANY $(MAKE) enable-cache; done;

add-filter:
	curl -X POST --data "excludingCounterparties=$(EXCLUDING_COUNTERPARTIES)" '$(URL_BASE)/gl/$(COMPANY)/add-filter' | ./node_modules/.bin/underscore pretty

add-filter-multi:
	for COMPANY in $(COMPANIES); do COMPANY=$$COMPANY $(MAKE) add-filter; done;

transaction-info:
	curl '$(URL_BASE)/gl/$(COMPANY)/transaction/$(TRANSACTION)' | ./node_modules/.bin/underscore pretty

account-transactions:
	curl '$(URL_BASE)/gl/$(COMPANY)/account/$(ACCOUNT)/transactions' | ./node_modules/.bin/underscore pretty

snapshot-transactions:
	curl '$(URL_BASE)/gl/$(COMPANY)/snapshot-transactions?snapshotDate=$(DATE)' | ./node_modules/.bin/underscore pretty

delete-transaction:
	curl -X POST '$(URL_BASE)/gl/$(COMPANY)/transaction/$(TRANSACTION)/delete' | ./node_modules/.bin/underscore pretty

.PHONY: test test-cucumber docs
