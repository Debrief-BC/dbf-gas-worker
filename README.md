## Debrief gas worker

Transfer dbf to users before a user initiates a transaction in order for them to perform transactions on blockchain.

Gas transfer works as follow:

1. Client calls claim
2. API uses PubSubService to publish Claim event.
