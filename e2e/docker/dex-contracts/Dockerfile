FROM node:lts

WORKDIR /app/dex-contracts

RUN git clone --depth 1 --branch graph_data_with_reversion https://github.com/gnosis/dex-contracts . &&\
    yarn && yarn prepack
ADD entrypoint.sh .

CMD ["./entrypoint.sh"]
