#!/usr/bin/python

import argparse
import sys

import api.server
import api.locale
from api_requests import *
from api_requests.admin import *
from api_requests.admin_web import *
import libs.config

if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Rainwave API server.")
	parser.add_argument("--config", default=None)
	args = parser.parse_args()
	api.locale.load_translations()
	api.locale.compile_static_language_files()
	libs.config.load(args.config)
	server = api.server.APIServer()
	sys.exit(server.start())
