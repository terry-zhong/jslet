var dsAnimalType = jslet.data.createEnumDataset('animaltype',{'1':'Felidas','2':'Canine','3':'Bear'});

var dsFelidas = jslet.data.createEnumDataset('felidas',{'1':'Lion','2':'Tiger','3':'Cat'});

var dsCanine = jslet.data.createEnumDataset('canine',{'1':'Wolf','2':'Fox','3':'Dog'});

var dsBear = jslet.data.createEnumDataset('bear',{'1':'Polar Bear','2':'Grizzly Bear','3':'Panda'});

var dsAnimals = new jslet.data.Dataset('animals');

var f = jslet.data.createStringField('animaltype', 10);
f.label('Animal Type');
var lkf = new jslet.data.LookupField();
lkf.lookupDataset(dsAnimalType);
f.lookupField(lkf);
dsAnimals.addField(f);

f = jslet.data.createStringField('powerfulanimal', 20);
f.label('Most Powerful Animal');
lkf = new jslet.data.LookupField();
f.lookupField(lkf);
dsAnimals.addField(f);
f.onGetLookupField = function(lkFld) {
	var type = this.dataset().getFieldValue('animaltype');
	if (type == '1')
		lkFld.lookupDataset(dsFelidas);
	else if (type == '2')
		lkFld.lookupDataset(dsCanine);
	else
		lkFld.lookupDataset(dsBear);

}

lkFelidas = new jslet.data.LookupField();
lkFelidas.lookupDataset(dsFelidas);

lkCanine = new jslet.data.LookupField();
lkCanine.lookupDataset(dsCanine);

lkBear = new jslet.data.LookupField();
lkBear.lookupDataset(dsBear);

var cr = new jslet.data.ContextRule(dsAnimals);
cr.addRuleItem('powerfulanimal','[animaltype]=="1"', null,null);
cr.addRuleItem('powerfulanimal','[animaltype]=="2"', null,null)
cr.addRuleItem('powerfulanimal','[animaltype]=="3"', null,null)
dsAnimals.contextRule(cr);
dsAnimals.enableContextRule();

//dsAnimals.contextRule([{
//			condition : '[animaltype]=='1'',
//			resultField : 'powerfulanimal'
////			resultLookupField : lkFelidas
//		},
//		{
//			condition : '[animaltype]=='2'',
//			resultField : 'powerfulanimal'
////			resultLookupField : lkCanine
//		},
//		{
//			condition : '[animaltype]=='3'',
//			resultField : 'powerfulanimal'
////			resultLookupField : lkBear
//		}]);


var dataList = [{
			animaltype : '1',
			powerfulanimal : '1'
		}, {
			animaltype : '2',
			powerfulanimal : '2'
		}, {
			animaltype : '3',
			powerfulanimal : '1'
		}];
dsAnimals.dataList(dataList);
