# Stage 1: Build the project with Maven
FROM maven:3.9.3-eclipse-temurin-17 as build
WORKDIR /app
COPY pom.xml .
# COPY settings.xml /root/.m2/settings.xml
# COPY rootcert.crt /tmp/yourcorp-ca.crt

# RUN keytool -importcert -noprompt -trustcacerts -alias yourcorp-ca -file /tmp/yourcorp-ca.crt -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit

# COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the jar in a lightweight Java runtime
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]