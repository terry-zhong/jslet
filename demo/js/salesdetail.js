(function () {
    //Create lookup dataset
    var dsPaymentTerm = jslet.data.createEnumDataset("dsPaymentTerm", {'01':'M/T','02':'T/T'});
    //------------------------------------------------------------------------------------------------------

    var dsCustomer = jslet.data.createEnumDataset("dsCustomer", {'01':'ABC','02':'Oil Group LTD','03':'Mail Group LTD'});
    //------------------------------------------------------------------------------------------------------
    var detailFldCfg = [{name: 'seqno', type: jslet.data.DataType.NUMBER, label: 'Sales ID'},
                    {name: 'product', type: jslet.data.DataType.STRING, label: 'Customer', length: 20},
                    {name: 'qty', type: jslet.data.DataType.NUMBER, label: 'Quantity', length: 11},
                    {name: 'price', type: jslet.data.DataType.NUMBER, label: 'Price', length: 11, scale: 2},
                    {name: 'amount', type: jslet.data.DataType.NUMBER, label: 'Amount', length: 11, scale: 2, formula: '[qty]*[price]'}
                   ];
    
    var dsSaleDetail = jslet.data.createDataset('dsSaleDetail', detailFldCfg);
    
    var fieldCfg = [{name: 'saleid', type: jslet.data.DataType.STRING, label: 'Sales ID'},
                    {name: 'saledate', type: jslet.data.DataType.DATE, label: 'Sales Date', displayFormat: 'yyyy-MM-dd'},
                    {name: 'customer', type: jslet.data.DataType.STRING, label: 'Customer', length: 20, lookup: {dataset: dsCustomer}},
                    {name: 'paymentterm', type: jslet.data.DataType.STRING, label: 'Payment Term', lookup: {dataset: dsPaymentTerm}},
                    {name: 'comment', type: jslet.data.DataType.STRING, length: 20, label: 'comment'},
                    {name: 'details', type: jslet.data.DataType.DATASET, label: 'details', detailDataset: 'dsSaleDetail'}
                   ];
    
    var dsSaleMaster = jslet.data.createDataset('dsSaleMaster', fieldCfg);

    //Add data into detail dataset
    var detail1 = [{ "seqno": 1, "product": "P1", "qty": 2000, "price": 11.5 },
				{ "seqno": 2, "product": "P2", "qty": 1000, "price": 21.5 },
				{ "seqno": 3, "product": "P3", "qty": 3000, "price": 31.5 },
				{ "seqno": 4, "product": "P4", "qty": 5000, "price": 41.5 },
				{ "seqno": 5, "product": "P5", "qty": 8000, "price": 51.5}];

    var detail2 = [{ "seqno": 1, "product": "M1", "qty": 1, "price": 10001 },
    				{ "seqno": 2, "product": "M2", "qty": 2, "price": 30000}];

    //Add data into master dataset
    var dataList = [{ "saleid": "200901001", "saledate": new Date(2001, 1, 1), "customer": "02", "paymentterm": "02", "details": detail1 },
			{ "saleid": "200901002", "saledate": new Date(2001, 1, 1), "customer": "01", "paymentterm": "01", "details": detail2 },
			{ "saleid": "200901003", "saledate": new Date(2001, 1, 1), "customer": "02", "paymentterm": "02"}];
    dsSaleMaster.dataList(dataList);
})();