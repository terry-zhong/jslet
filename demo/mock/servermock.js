(function() {
    var employeeList = [{
        workerid: 1,
        name: 'Tom',
        department: '0101',
        gender: 'M',
        age: 48,
        birthday: new Date(1961, 1, 23),
        province: '01',
        city: '0110',
        position: '1',
        married: 1,
        university: 'Peking University',
        photo: '1.jpg',
        salary: 1000
    },

    {
        workerid: 2,
        name: 'Marry',
        department: '03',
        gender: 'F',
        age: 26,
        birthday: new Date(1983, 8, 23),
        province: '02',
        city: '0201',
        position: '2',
        married: 0,
        university: 'Harvard University',
        photo: '2.jpg',
        salary: 2000
    },

    {
        workerid: 3,
        name: 'Jerry',
        department: '0201',
        gender: 'M',
        age: 32,
        birthday: new Date(1977, 5, 22),
        province: '13',
        city: '1305',
        position: '3',
        married: 1,
        university: 'TsingHua University',
        photo: '3.jpg',
        salary: 3200
    },

    {
        workerid: 4,
        name: 'John',
        department: '00',
        gender: 'M',
        age: 48,
        birthday: new Date(1961, 1, 6),
        province: '13',
        city: '1311',
        position: '0',
        married: 1,
        university: 'Peking University',
        photo: '4.jpg',
        salary: 7800
    },

    {
        workerid: 5,
        name: 'Monica',
        department: '04',
        gender: 'F',
        age: 38,
        birthday: new Date(1971, 8, 23),
        province: '06',
        city: '0605',
        position: '1',
        married: 0,
        university: 'Cambridge University',
        photo: '5.jpg',
        salary: 5000
    },

    {
        workerid: 6,
        name: 'Ted',
        department: '02',
        gender: 'U',
        age: 26,
        birthday: new Date(1983, 7, 12),
        province: '06',
        city: '0606',
        position: '3',
        married: 0,
        university: 'Cambridge University',
        photo: '6.jpg',
        salary: 3000
    },

    {
        workerid: 7,
        name: 'Jack',
        department: '02',
        gender: 'M',
        age: 26,
        birthday: new Date(1983, 9, 12),
        province: '06',
        city: '0606',
        position: '3',
        married: 0,
        university: 'MIT',
        photo: '6.jpg',
        salary: 3000
    },

    {
        workerid: 8,
        name: 'Mike',
        department: '02',
        gender: 'M',
        age: 26,
        birthday: new Date(1983, 8, 12),
        province: '06',
        city: '0606',
        position: '3',
        married: 0,
        university: 'MIT',
        photo: '6.jpg',
        salary: 3000
    },

    {
        workerid: 9,
        name: 'Jessica',
        department: '03',
        gender: 'F',
        age: 25,
        birthday: new Date(1984, 8, 23),
        province: '03',
        city: '0307',
        position: '3',
        married: 1,
        university: 'Harvard University',
        photo: '7.jpg',
        salary: 8000
    }];
   
    var departmentList = [{
        deptid: '00',
        name: 'Admin Dept.',
        address: 'Shenzhen',
        parentid: ''
    }, {
        deptid: '01',
        name: 'Marketing Dept.',
        address: 'Beijing',
        parentid: ''
    }, {
        deptid: '0101',
        name: 'Chengdu Branch.',
        address: 'Chengdu',
        parentid: '01'
    }, {
        deptid: '0102',
        name: 'Shanghai Branch ',
        address: 'Shanghai',
        parentid: '01'
    }, {
        deptid: '02',
        name: 'Dev. Dept.',
        address: 'Shenzhen',
        parentid: ''
    }, {
        deptid: '0201',
        name: 'Dev. Branch 1',
        address: 'Shenzhen',
        parentid: '02'
    }, {
        deptid: '0202',
        name: 'Dev. Branch 2',
        address: 'Shenzhen',
        parentid: '02'
    }, {
        deptid: '03',
        name: 'QA',
        address: 'Shenzhen',
        parentid: ''
    }, {
        deptid: '04',
        name: 'FA Dept.',
        address: 'Shenzhen',
        parentid: ''
    }];
    
	employeeService = {
		findAll : function() {
			return employeeList;
		},
		
		save: function(employees) {
			var emp, state, id;
			for(var i = 0, len = employees.length; i < len; i++) {
				emp = employees[i];
				state = emp.rs;
				if(state[0] === 'd' || state[0] === 'u') {
					id = emp.workerid;
					for(var j = 0, len1 = employeeList.length; j < len1; j++) {
						if(employeeList[j].workerid == id) {
							if(state[0] === 'd') {
								employeeList.splice(j, 1);
							} else {
								employeeList.splice(j, 1, emp);
							}
							break;
						}
					}
				} else {
					employeeList.push(emp);
				}
			}
			return employees;
		}
	}

	jQuery.mockjax({
		url : "/demo/employee/findall",
		contentType : "application/json",
		responseTime: 200,
		responseText : {main: employeeService.findAll()}
	});
	
	jQuery.mockjax({
		url : "/demo/employee/findEmployeeAndDepartment",
		contentType : "application/json",
		responseTime: 200,
		responseText : {main: employeeService.findAll(), extraEntities: {department: departmentList}}
	});
	
	jQuery.mockjax({
		url : "/demo/employee/save",
		contentType : "application/json",
		dataType: 'json',
		responseTime: 200,
		response: function(request) {
			var data = JSON.parse(request.data);
			data.main = employeeService.save(data.main);
			this.responseText = data;
		}
	});

	jQuery.mockjax({
		url : "/demo/employee/queryerror",
		contentType : "application/json",
		dataType: 'json',
		responseTime: [100, 300],
		response: function(request) {
			var data = {
				errorCode: '1234',
				errorMessage: 'Invalid data!'
			}
			this.responseText = data;
		}
	});

	/* Order */
	var orderList = [
	     {product: 'TV', price: 3000, quantity: 50},
	     {product: 'Computer', price: 7500, quantity: 30},
	     {product: 'Car', price: 20000, quantity: 3},
	     {product: 'Mouse', price: 26, quantity: 700},
	     {product: 'Desk', price: 300, quantity: 150}
	    ];
	
	var orderService = {
			findAll: function() {
				return orderList;
			},
			
			audit: function(orders) {
				var order;
				for(var i = 0, len = orders.length; i < len; i++) {
					order = orders[i];
					order.state = 'audit';
					order.auditor = 'Jack';
					order.auditdate = new Date();
				}
				return orders;
			},
			
			cancelAudit: function(orders) {
				var order;
				for(var i = 0, len = orders.length; i < len; i++) {
					order = orders[i];
					order.state = '';
					order.auditor = '';
					order.auditdate = null;
				}
				return orders;
			}

	}
	
	jQuery.mockjax({
		url : "/demo/order/findall",
		contentType : "application/json",
		dataType: 'json',
		responseTime: [100, 300],
		response: function(request) {
			this.responseText = {main: orderService.findAll()};
		}
	});

	jQuery.mockjax({
		url : "/demo/order/audit",
		contentType : "application/json",
		dataType: 'json',
		responseTime: [100, 300],
		response: function(request) {
			var data = JSON.parse(request.data);
			data.main = orderService.audit(data.main);
			this.responseText = data;
		}
	});

	jQuery.mockjax({
		url : "/demo/order/cancelaudit",
		contentType : "application/json",
		dataType: 'json',
		responseTime: [100, 300],
		response: function(request) {
			var data = JSON.parse(request.data);
			data.main = orderService.cancelAudit(data.main);
			this.responseText = data;
		}
	});

	var bomService = {
		find: function(pageNo, pageSize, pageCount) {
			var result = [];
			var count = pageNo + pageSize;
			for(var i = 1; i <= pageSize; i++) {
				result.push({itemid: 'item' + (i + (pageNo - 1) * pageSize), quantity: Math.round(Math.random()* 20)});
			}
			return result;
		}
	}
	
	jQuery.mockjax({
		url : "/demo/bom/find",
		contentType : "application/json",
		dataType: 'json',
		responseTime: [100, 300],
		response: function(request) {
			var data = JSON.parse(request.data);
			data.pageCount = Math.ceil(20000 / data.pageSize);
			data.main = bomService.find(data.pageNo, data.pageSize, data.pageCount);
			this.responseText = data;
		}
	});

	
})();
