FROM node:18-alpine

# Install Python 3 and required packages using apk
RUN apk add --no-cache \
    python3 \
    py3-pip \
    py3-requests \
    py3-pandas \
    py3-matplotlib \
    py3-scikit-learn \
    py3-joblib

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]