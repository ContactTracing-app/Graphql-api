<p align="center">
  <img height="300" src="https://storage.googleapis.com/stateless-quander-website-v3-a/1/2019/01/API@100-1-650x615.jpg">
  <h1 align="center">Quander<br /> TypeScript Grandstack</p>
</p>

## Setup The Project

-   Clone this repo
-   Run `npm install`
-   Modify `.env` with your database settings

## Seed Data

If you want to play with some data, I've written a script to pull down handset data from the Samsung website (AEM) so you can import it into your Neo4j DB.

From your project run `npm run seed`.

Once the command is complete, run the below query in Neo4j desktop. Make sure you change the devices.json file path to your project folder.

```
CALL apoc.load.json('file:///path/to/project/data/devices.json') YIELD value AS device
MERGE (product:Product { id: device.code, name: device.name, thumb: device.thumbUrl, price: device.price, released: datetime({epochmillis: apoc.date.parse(device.released, 'ms', 'yyyy-MM-dd')}) })
MERGE (category:Category { id: device.category.id, name: device.category.name })
MERGE (color:Color { name: device.color })
MERGE (product)-[:BELONGS_TO]->(category)
MERGE (product)-[:HAS_COLOR]->(color)
WITH device, product
UNWIND device.features AS feature
WITH feature.key AS feature_key, feature.value AS feature_value, product
MERGE (feature:Feature {key: feature_key, value: feature_value})
MERGE (product)-[:HAS_FEATURE]->(feature)
```

## Deployment

TODO

### Google Cloud Platform

TODO

### Azure

TODO

### AWS

TODO

## Cool Queries

### Relevancy

This will give you devices that are relevant to a device model

```
MATCH (o:Product {id: 'SM-G975FCWGBTU' })-[:HAS_FEATURE]->(f:Feature)<-[:HAS_FEATURE]-(p:Product)
WHERE p.price > (o.price / 1.3)
WITH p as product, count(*) AS relevancy, p.released as released, collect(distinct f.value) as features
RETURN product
ORDER BY relevancy, product.released DESC
```
