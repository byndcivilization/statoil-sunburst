import csv
import sys
import json
import pprint


pp = pprint.PrettyPrinter(indent=4)
reader = csv.reader(open('payment1.csv', 'rU'), dialect='excel')

# country = {}
index = {}
data = {'name' : 'EITI', 'children' : []}

for row in reader:
	# handle countries
	if row[0] in index:
		pass
	else:
		index[row[0]] = {'index' : len(data['children']), 'company' : {}}
		data['children'].append({'name' : row[0], 'children' : []})
	# handle companies
	if row[1] in index[row[0]]['company']:
		pass
	else:
		index[row[0]]['company'][row[1]] = len(data['children'][index[row[0]]['index']]['children'])
		data['children'][index[row[0]]['index']]['children'].append({'name' : row[1], 'children' : []})
	
	# handle projects
	data['children'][index[row[0]]['index']]['children'][index[row[0]]['company'][row[1]]]['children'].append({'name' : row[3], 'payment' : int(row[5]), 'recieved' : int(row[4])})

# pp.pprint(data['children'])

with open('payment1.json', 'w') as outfile:
    json.dump(data, outfile, sort_keys = True, indent = 4,ensure_ascii=False)
# pp.pprint(index['Trinidad']['company']['BGGroup'])