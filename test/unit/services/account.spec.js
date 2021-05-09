"use strict";

const { ServiceBroker, Context } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const AccountService = require("../../../services/account.service");


describe("Test 'accounts' service", () => {

    const broker = new ServiceBroker({ logger: false });
	const service = broker.createService(AccountService);
	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	// Test get list account
	describe("Test 'account.ACT_ACCOUNT' action", () => {
		it("should return object include error, message and data encrytion", async () => {

            const res = await broker.call("account.ACT_ACCOUNT");
			expect(res).toEqual({
				error: expect.any(Boolean),
				message: 'get_list_user_success',
				data: expect.any(String),
			});
		});
	});	

	// Test register account
	describe("Test 'account.ACT_ACCOUNT_REGISTER' action for register new account", () => {
			
		let user1 = {
			fullName: "Demo-test1",
			email: 'demo-1@gmail.com',
			password: '123123123',
			};
		let user2 = {
			fullName: "Demo-test3",
			email: 'demo-1@gmail.com',
			password: '123123123',
			};

		// it("should return object include error, message and data encrytion", async () => {
		// 	const res = await broker.call("account.ACT_ACCOUNT_REGISTER", user1);
		// 	expect(res).toEqual({
		// 		error: expect.any(Boolean),
		// 		message: 'insert_success',
		// 		data: expect.any(Object),
		// 	}); 
		// });
		it("should throw error if email is exist", async () => {
			const res = await broker.call("account.ACT_ACCOUNT_REGISTER", user2);
			expect(res).toEqual({
				error: expect.any(Boolean),
				message: 'email_exists',
				data: expect.any(Array),
			});
		});
	});

	// Test login account
	describe("Test 'account.ACT_ACCOUNT_LOGIN' action for login account", () => {
			
		let user1 = {
			email: '1@gmail.com',
			password: '123123',
			};
		let user2 = {
			email: 'demo-demo@gmail.com',
			password: '123123123',
			};
		let user3 = {
			email: '1@gmail.com',
			password: 'wrongpass123',
			};

		it("should return object include error, message and data encrytion", async () => {
			const res = await broker.call("account.ACT_ACCOUNT_LOGIN", user1);
			expect(res).toEqual({
				error: expect.any(Boolean),
				message: 'login_success',
				data: expect.any(Object),
			}); 
		});
		it("should throw error if email is not exist", async () => {
			const res = await broker.call("account.ACT_ACCOUNT_LOGIN", user2);
			expect(res).toEqual({
				error: expect.any(Boolean),
				message: 'email_not_exist',
				data: expect.any(Array),
			});
		});
		it("should throw error if password not exist", async () => {
			const res = await broker.call("account.ACT_ACCOUNT_LOGIN", user3);
			expect(res).toEqual({
				error: expect.any(Boolean),
				message: 'password_not_exist',
				data: expect.any(Array),
			});
		});
	});
});
