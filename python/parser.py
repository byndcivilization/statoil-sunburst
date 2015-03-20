#!/usr/bin/python
"""Parses excel sheets into JSON"""

from datetime import datetime
from iso3166 import countries
from utils import get_cell
# from xlrd import cellname
# import re
# from pprint import pprint

def parse(sheet_name, sheet, data):
    """Main parsing function"""
    # create row and label dict on header
    labels = sheet.row(0)
    lkey = {str(labels[i])\
    .replace("text:u", "")\
    .replace("'", "")\
    .replace(" ", "_")\
    .lower():\
    i for i in range(0, len(labels))}

    rkey = {}
    for key in lkey:
        rkey[lkey[key]] = key

    # get number of rows
    nrows = sheet.nrows

    country_text = get_cell(sheet, 1, 8)

    if country_text == 'IRAN':
        country_name = 'Iran, Islamic Republic of'
    elif country_text == 'RUSSIA':
        country_name = 'Russian Federation'
    elif country_text == 'UK':
        country_name = 'United Kingdom'
    elif country_text == 'VENEZUELA':
        country_name = 'Venezuela, Bolivarian Republic of'
    else:
        country_name = countries.get(country_text).name

    country_code = countries.get(country_name).alpha3

    data.append({'name': 'Country of ' + country_name, 'country_code': country_code, 'children': []})

    for row in range(1, nrows):
        if get_cell(sheet, row, 0) == 'Total':
            pass
        else:
            data[-1]['children'].append({'name': get_cell(sheet, row, 0)})

            val = get_cell(sheet, row, 1)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['taxes'] = int(val)

            val = get_cell(sheet, row, 2)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['royalties'] = int(val)

            val = get_cell(sheet, row, 3)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['fees'] = int(val)

            val = get_cell(sheet, row, 4)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['bonuses'] = int(val)

            val = get_cell(sheet, row, 5)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['gov_entitlements_value'] = int(val)

            val = get_cell(sheet, row, 6)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['gov_entitlements_mmboe'] = int(val)

            val = get_cell(sheet, row, 7)
            if not val or val == '-':
                pass
            else:
                data[-1]['children'][-1]['total'] = int(val)