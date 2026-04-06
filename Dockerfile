FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY dist/ ./dist/
EXPOSE 3000
CMD ["serve", "dist", "-l", "3000", "-s"]
