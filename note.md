# Collint Protocol

## Word object

```json
{
	"lang": "langCode",
	"word": "UTF8String",
	"pronunciation": "UTF8String",
	"translations": [
		{
			"lang": "langCode",
			"type": "WordType",
			"translation": "UTF8String"
		}
	],
	"examples": [
		{
			"lang": "langCode",
			"example": "A UTF8String with ~ substituting the word"
		}
	]
}
```

## Registration

```json
{
	"type": "c",
	"data": {
		"mode": "user",
		"name": "UserName",
		"password": "Plain password"
	}
}
```

```json
{
	"status": 201
}
```

## Login

```json
{
	"type": "r",
	"data": {
		"mode": "user",
		"name": "UserName",
		"password": "Plain password"
	}
}
```

```json
{
	"status": 200,
	"data": {
		"token": "Token"
	}
}
```

## Create/Update word

```json
{
	"type": "c (u for update)",
	"data": {
		"mode": "word",
		"word": { "WordObject":"..." },
		"token": "Token"
	}
}
```

```json
{
	"status": 201
}
```

## Query word

```json
{
	"type": "r",
	"data": {
		"mode": "word",
		"query": "UTF8String|RegExp",
		"token": "Token"
	}
}
```

```json
{
	"status": 200,
	"data": [
		{ "WordObject":"..." }
	]
}
```

## Delete word

```json
{
	"type": "d",
	"data": {
		"mode": "word",
		"query": "WordOID"
	}
}
```
