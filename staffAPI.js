import Q from './node_modules/q';

const StaffAPI = {
	createCompany(companyData) {
		return Q.resolve(companyData);
	},

	inviteUser(companyData, userData) {
		return Q.resolve(userData);
	}
}

export default StaffAPI;