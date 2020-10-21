FROM node:lts

WORKDIR /app/dex-contracts

RUN git clone --depth 1 --branch master https://github.com/gnosis/dex-contracts . &&\
    yarn && yarn prepack
ADD entrypoint.sh .

CMD ["./entrypoint.sh"]
