const customerModel = require('../models/customerModel.js');
const cookie = require('cookie');

const readItem = async (req, res) => {
	const { account_id, item_code } = req.params;
	const result = await customerModel.readItem(account_id, item_code);
	let obj = result[0];

	obj.item_code = item_code;
	obj.account_id = account_id;
	obj.price = obj.purchase_cost * obj.margin_ratio + obj.purchase_cost;	//make profit
	const priceString = obj.price.toString().split('');		//3자리마다 쉼표 박기
	let count = 0;
	for(var i=priceString.length -1; i>0; i--){
		if(++count%3 === 0){
			priceString.splice(i, 0, ',');
		}
	}
	let temp = '';
	for(var i=0; i<priceString.length; i++){
		temp += priceString[i];
	}
	obj.price = temp;
	delete obj.purchase_cost;

	obj.registered_date = obj.registered_date.toLocaleDateString();		//date format change

	const cookies = cookie.parse(req.headers.cookie);

	if(cookies.bestCustomer === undefined || cookies.bestCustomer === ''){		//쿠키가 maxAge를 넘으면 그냥 사라지는게 아니다, value값이 삭제 될 뿐이다. 그래서 조건이 [쿠키가 존재하지 않을 때], [쿠키의 value가 비어있을 때] 두 가지다.
		obj.customerId = null;			//null이면 새로 쿠키를 생성하도록 ejs와 연계하여 구현
	}else{
		obj.customerId = cookies.bestCustomer;
	}

	return res.render('pricetag', obj);
}

const putIntoCart = (req, res) => {
	const { account_id, item_code, createCustomerId, readCustomerId, quantity, barcode } = req.body;
	let redirectId;		//to deal with both cases
	if(createCustomerId !== undefined){		// if no cookie discovered, generate cookie
		redirectId = createCustomerId;
		res.cookie('bestCustomer', createCustomerId, {
			maxAge: 1000*60*60*12,
		});		// generate cookie
		//console.log('cookie created as: ', createCustomerId);
	}else if(readCustomerId !== undefined){
		redirectId = readCustomerId;
		//console.log('cookie discovered as: ', readCustomerId);
	}

	const obj = {
		account_id: account_id,
		item_code: item_code,
		customerId: redirectId,
		quantity: quantity,
		barcode: barcode,
	}
	//console.log(account_id, item_code, quantity);
	customerModel.putIntoCart(obj);
	return res.redirect(`http://localhost:5000/customer/cart/${redirectId}`);
}

const checkMyCart = async (req, res) => {
	const customerId = req.params.customerId;
	const result = await customerModel.checkMyCart(customerId);
	let priceString = '';
	let temp;
	for(var i=0; i<result.length; i++){				//판매가격 만들고 매입비용 데이터는 삭제
		result[i].price = result[i].purchase_cost * result[i].margin_ratio + result[i].purchase_cost;

		priceString = result[i].price.toString().split('');		//3자리마다 쉼표 박기
		let count = 0;
		for(var j=priceString.length -1; j>0; j--){
			if(++count%3 === 0){
				priceString.splice(j, 0, ',');
			}
		}
		temp = '';
		for(var j=0; j<priceString.length; j++){
			temp += priceString[j];
		}
		result[i].price = temp;

		delete result[i].purchase_cost;
	}
	let shortCustomerId = '';		//끝 4자리만 나오게
	let tempArr = customerId.split('');
	for(var i=0; i<4; i++){
		 shortCustomerId += tempArr[tempArr.length-(i+1)];
	}
	const obj = {
		shortCustomerId: shortCustomerId,
		customerId: customerId,
		inCart: result,
	}
	return res.render('checkMyCart', obj);
}

const updateCart = async (req, res) => {
	const { customerId, barcode, quantity } = req.body;
	customerModel.updateCart(customerId, barcode, quantity);
	return res.redirect(`http://localhost:5000/customer/cart/${customerId}`);
}

const deleteCart = async (req, res) => {
	const { customerId, barcode } = req.body;
	customerModel.deleteCart(customerId, barcode);
	return res.redirect(`http://localhost:5000/customer/cart/${customerId}`);
}

module.exports = {
	readItem,
	checkMyCart,
	putIntoCart,		//redirect to readCart
	updateCart,			//redirect to readCart
	deleteCart,			//redirect to readCart
}
