#!/usr/bin/python
"""Parses and loads statoil data into sunburst json doc"""


from xlrd import open_workbook
from sys import argv
from parser import parse
from pprint import pprint
from utils import write_json

def main(args):
    """Main body"""
    args_len = len(args)

    # set source excel and destination json files
    if args_len == 1:
        src = './data/' + args[0] + '.xlsx'
        gov_dest = './data/' + args[0] + '_gov.json'
        proj_dest = './data/' + args[0] + '_proj.json'
    else:
        print 'you must enter valid source and destination file names. If you enter a single \
        argument, that will be taken as both source and desitnation name. Please limit input \
        to two arguments.'
        exit()

    # Error handling for non-existing files
    try:
        workbook = open_workbook(src)
    except IOError:
        print 'File does not exist. Please give a valid source file'
        exit()

    gov_data = {'name' : 'Statoil Government Payments', 'children' : []}
    proj_data = {'name' : 'Statoil Project Payments', 'children' : []}

    # get sheets names
    sheet_names = workbook.sheet_names()
    for sheet in sheet_names:
        if 'Consolidated' in sheet or 'Taxes paid in kind' in sheet:
            print '###' + sheet
        elif 'gov' in sheet or 'FAROE ISLANDS - Payments per go' in sheet:
            parse(sheet, workbook.sheet_by_name(sheet), gov_data['children'])
        elif 'proj' in sheet or 'FAROE ISLANDS - Payments per pr' in sheet:
            parse(sheet, workbook.sheet_by_name(sheet), proj_data['children'])
        else:
            print sheet

    ###NEED TO WORK ON THIS...BSON DATE IS THROWING TYPE ERROR
    # Write out local json file
    write_json(gov_data, gov_dest)
    write_json(proj_data, proj_dest)

   

if __name__ == '__main__':
    main(argv[1:])
