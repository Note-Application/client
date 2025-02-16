genereteproto:
	protoc -I=./proto ./proto/noteapp.proto \
  --js_out=import_style=commonjs:src/generated/ \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:src/generated/ \
  --plugin=protoc-gen-grpc-web=/usr/local/bin/protoc-gen-grpc-web

