FROM node:18-alpine

RUN apk add --no-cache bash
RUN apk add --no-cache make

WORKDIR /

COPY . ./

RUN make install

EXPOSE 3000

CMD ["./entrypoint.sh"]
