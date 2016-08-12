import faker from './node_modules/faker';

const contentProvider = {
	getNewCompanyData() {
		return {
			name: faker.company.companyName(),
		}
	},

	getNewUserData() {
		return {
		  name: faker.name.findName(),
		  email: faker.internet.email(),
		  role: faker.hacker.adjective()
		}
	}
}

export default contentProvider;