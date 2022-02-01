const accountsModel = require('../models/accountsModel.js');

const read_all_accounts = async (req, res) => {
	const result = await accountsModel.read_all_accounts();

	return res.json(result);
}

const create_account = (req, res) => {
	const result = accountsModel.create_account(req.body.name);

	return res.json(result);
}

module.exports = {
	read_all_accounts,
	create_account,
}
