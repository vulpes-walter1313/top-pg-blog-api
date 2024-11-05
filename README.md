# Models

## Users

```sql
CREATE TABLE IF NOT EXISTS users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	first_name VARCHAR(30),
	last_name VARCHAR(30),
	email VARCHAR(320),
	password TEXT,
	isAdmin BOOLEAN
);
```

## Posts

```sql
CREATE TABLE IF NOT EXISTS posts (
	id SERIAL PRIMARY KEY,
	title VARCHAR(256) NOT NULL,
	content VARCHAR(5000) NOT NULL,
	author_id uuid NOT NULL,
	slug VARCHAR(128) NOT NULL,
	published BOOLEAN NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(author_id)
		REFERENCES users(id)
);
```

## comments

```sql
CREATE TABLE IF NOT EXISTS comments (
	id SERIAL PRIMARY KEY,
	content VARCHAR(1024) NOT NULL,
	author_id uuid NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
	post_id INT NOT NULL,
	FOREIGN KEY(author_id)
		REFERENCES users(id),
	FOREIGN KEY(post_id)
		REFERENCES posts(id)
);
```

# Standard Error Response

there can be many reasons why a request can't be performed. This is the structure of the error response
the route will return:

```json
{
  "success": false,
  "error": "this field will show up is it's a simple error",
  "errors": [
    {
      // this is for express validator errors.
    }
  ]
}
```

# Routes

This is the complete list of api routes as of 2024-10-17:

- POST `/login`
- POST `/register`
- GET `/posts`
- POST `/posts`
- GET `/posts/:postSlug`
- PUT `/posts/:postSlug`
- DELETE `/posts/:postSlug`
- GET `/posts/:postSlug/comments`
- POST `posts/:postSlug/comments`
- PUT `/posts/:postSlug/comments/:commentId`
- DELETE `/posts/:postSlug/comments/:commentId`

## POST `/login`

Expected JSON body:

```json
{
  "username": "something@email.com",
  "password": "mycoolpassword"
}
```

200 response:

```json
{
  "success": true,
  "token": "<insert token here>"
}
```

## POST `/register`

Expected JSON body:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "johndoe@email.com",
  "password": "pass1234",
  "confirmPassword": "pass1234"
}
```

On Success Response:

```json
{
  "success": true,
  "msg": "Successfully registered user"
}
```

On failure response:

```json
{
  "success": false,
  "errors": [{}] // some validation errors here
}
```

## GET `/posts`

This route will be paginated as there can be a lot of posts. The post are automatically
filtered to only show published posts if the user requesting this endpoint is unauthenticated
or not an admin. If the user is admin, he is allowed to use
the param `publishedstatus=<all | published | unpublished>`

Query Params:

- Limit (default 10)
  - We can force an upper limit of 50 per page and a lower limit of 5 per page.
- Page (default 1)
  - Standard use case here
- publishedstatus
  - valid values are "all", "unpublished", "published"
  - non-admin users can only see published posts

On success response:

```json
{
  "success": true,
  "posts": [
    {
      "id": 1234567890,
      "title": "Some cool title",
      "content": "Long content text",
      "authorName": "John",
      "createdAt": "2024-10-28T09:53:00.000Z",
      "updatedAt": "2024-10-28T09:53:00.000Z",
      "slug": "some-cool-title",
      "published": true
    }
  ],
  "currentPage": 1,
  "totalPages": 25,
  "totalPosts": 245
}
```

On failure response: Standard error response

## POST `/posts`

Only the admin user can create posts. So a simple auth verification can end the request early.

Expected JSON body:

```json
{
  "title": "Some cool title",
  "content": "the body of the blog post",
  "slug": "some-cool-title",
  "published": true
}
```

on success response:

```json
{
  "success": true,
  "msg": "post created"
}
```

on error response: standard error response.

## GET `/posts/:postSlug`

This will get an individual post. No query params. postId will be validated as a number.
Only the admin can see unpublished posts.

on success response:

```json
{
  "success": true,
  "post": {
    "id": 1,
    "title": "some cool title",
    "content": "some cool blog content",
    "authorName": "John Doe",
    "createdAt": "2024-10-28T09:53:00.000Z",
    "updatedAt": "2024-10-28T09:53:00.000Z",
    "slug": "some-cool-title",
    "published": true
  }
}
```

on error response: standard error response

## PUT `/posts/:postSlug`

Updates values from the post. only admin can perform this action

values that can be updated:

- title
- content
- published

The updatedAt propery should be updated along with the other values.

expected JSON body:

```json
{
  "title": "some other cool title",
  "content": "some other cool content",
  "slug": "new-slug-here",
  "published": true
}
```

on error response: standard error.

## DELETE `/posts/:postSlug`

route attributes:

- only admin can perform this action
- no query params

on success response:

```json
{
  "success": true,
  "msg": "post <postId> successfully deleted"
}
```

## GET `/posts/:postSlug/comments`

route attributes

- only accessible if post is published
- has query params
  - limit (lower limit: 5, upper limit: 25, default: 10)
  - page (default: 1)

on success response:

```json
{
  "success": true,
  "postId": 123,
  "comments": [
    {
      "id": 1,
      "content": "some cool comment here",
      "author": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-10-28T10:42:00.000Z",
      "updatedAt": "2024-10-28T10:42:00.000Z"
    }
  ],
  "currentPage": 1,
  "totalPages": 3,
  "limit": 10,
  "totalComments": 35
}
```

## POST `/posts/:postSlug/comments`

route attributes:

- only accessible if post is published
- postId is validated as a number

Expected JSON body:

```json
{
  "content": "Body of the comment here"
}
```

## PUT `/posts/:postSlug/comments/:commentId`

route attributes:

- accessible only when post is published
- can be updated if user is the comment author or admin

Expected JSON body:

```json
{
  "content": "Some update to the comment content"
}
```

on error response: standard error.

## DELETE `/posts/:postSlug/comments/:commentId`

route attributes:

- only admin or comment author can perform this action

on error response: standard error.
