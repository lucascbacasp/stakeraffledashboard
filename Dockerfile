FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY dist/ ./dist/
ENV PORT=3000
EXPOSE 3000
CMD sh -c "serve dist -l tcp://0.0.0.0:${PORT} -s"
