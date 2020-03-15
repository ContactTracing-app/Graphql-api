import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { v1 as uuid } from 'uuid'

const specFilter = [
	'Number of SIM',
	'External Memory Support',
	'ROM Size (GB)',
	'Video Recording Resolution',
	'Rear Camera - Resolution',
]

const uris = {
	productInfo: (modelCode: string) =>
		`https://shop.samsung.com/uk/servicesv2/getSimpleProductsInfo?productCodes=${modelCode}`,
	model: (modelCode: string) =>
		`https://api.samsung.com/model?key=56FE13336ABF4709AFCF7704B24D83F0&siteCode=uk&modelCode=${modelCode}&type=json`,
	findProducts: () =>
		'https://searchapi.samsung.com/productfinderGlobal?type=23020000&siteCd=uk&start=0&num=100&stage=live',
	getThumbnail: (thumb: string) =>
		`https://images.samsung.com/is/image/samsung/${thumb}?$PF_PRD_PNG$`,
}

const getPrice = async (modelCode: string) => {
	const response = await fetch(uris.productInfo(modelCode))
	const json = await response.json()

	if (json.productDatas[0].price) {
		return json.productDatas[0].price
	}

	return -1
}

const getModel = async (model: any) => {
	const response = await fetch(uris.model(model.code))
	const json = await response.json()

	const product = json.response.resultData.Products.Product

	const released = product.BasicInfo[0].CreationDate

	const features = product.Spec[0].SpecItems.SpecItem.map((spec: any) => {
		if (specFilter.find(filter => filter === spec.SpecItemNameLevel2)) {
			return {
				key: [spec.SpecItemNameLevel1, spec.SpecItemNameLevel2].join(
					' - '
				),
				value: spec.SpecItemValue,
			}
		}
	}).filter(Boolean)

	const price = await getPrice(model.code)

	return {
		...model,
		released,
		price,
		features,
	}
}

const getDevices = async (category: any) => {
	const response = await fetch(uris.findProducts())
	const json = await response.json()
	const productList = json.response.resultData.productList

	const models: any[] = []
	productList.forEach((product: any) => {
		product.modelList.forEach((model: any) => {
			models.push({
				code: model.modelCode,
				color: model.fmyChipName.toLowerCase(),
				name: model.displayName,
				category,
				thumbUrl: uris.getThumbnail(model.thumbUrl),
			})
		})
	})

	return Promise.all(models.map(model => getModel(model)))
}

const main = async () => {
	const categories = [
		{
			id: uuid(),
			name: 'Mobile Phone',
		},
	]

	const devices = await getDevices(categories[0])
	fs.writeFileSync(
		path.join(__dirname, '..', 'data', 'devices.json'),
		JSON.stringify(devices)
	)
}

main()
