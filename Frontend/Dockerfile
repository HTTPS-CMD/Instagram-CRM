# frontend/Dockerfile

# مرحله ۱: بیلد کردن پروژه ریکت
FROM node:18-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# مرحله ۲: سرو کردن با Nginx
FROM nginx:alpine
# کپی فایل‌های بیلد شده از مرحله قبل
COPY --from=build /app/dist /usr/share/nginx/html
# کپی تنظیمات Nginx که ساختیم
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]