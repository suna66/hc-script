# hc-script

## Overview

`hc-script` is script engine for easy to use HTTP request.

## Quick Start

#### install

```
npm install --global suna66/hc-script
```

#### Command

```
$ hcscript [script file] parameters... [OPTIONS]

OPTIONS:
    -h              display help.
    -s              no display http response
    -S              step mode
    -v              verbose mode
```

#### from source code

```
$ npm i
$ npm run build
$ npm link (if nesessary)
```

## Usage

#### Variables

You can define variables.
Variables begin with a letter and an underscore, and can contain numbers after that.
Variables can be integers, natural numbers, strings, and JSON objects.
Variables can be set in the following ways

```
var_integer = 10
var_number = 3.14
var_string = "hello hc-script"
var_json = {"name":"json-name"}
```

It is also possible to embed variables within strings or JSON strings.

```
var_number = 3.14
var_strInNum = "PI is ${var_number}."
```

#### HTTP Request

You can request HTTP server using following sentences.

```
{method} {URL}
{request-header}: {values}
   :
parameter: parameter1
parameter: parameter2
body: "request body"
<blank line>
```

Important thing is that blank line means end of HTTP request sentence.
For example, if you want to send a GET request to HTTP server, you should write follow:

```
GET http://localhost:8000/v1/users
content-type: application/json
authentication: Bearer XXXXXX
parameter: id=0001
```

And `hc-script` can store HTTP response to variables you define.
you should set variable name to "bind" section, so you can get the response you request to server.

```
GET http://localhost:8000/v1/users
content-type: application/json
authentication": Bearer XXXXXX
parameter: id=0001
bind: var_response
```

#### Output

`hc-script` has output function displaying in terminal.
It's very easy.you only should string literal in line.

```
"hello output string hc-script"
```

If you want to display variable value, you should write following string for example.

```
"PI is ${pi_number}."
```

#### Control Statement

`hc-script` has simple control statement. The following two control statements are provided.

- if
- while

##### if statement

```
if [condition statement]
    statement lists
       :
end
```

##### while statement

```
while [conditino statement]
    statement lists
       :
end
```

Conditional statements include “<”, “>”, “<=”, “>=”, “==”, “!=” are available.
You can also use `&&` and `||` to connect multiple conditions. parentheses is also available.

example)

```
if var1 > 100 && var1 < 200
    "var1 is larger then 100. and smaller then 200"
end
```

##### embedded function

`sleep [millisecond]`: Stops processing for a specified time.
