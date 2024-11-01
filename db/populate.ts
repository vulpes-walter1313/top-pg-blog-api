import "dotenv/config";
import db from "./db";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import slugify from "slugify";

async function main() {
  try {
    // create 3 users, 1 admin and 2 regular users
    const passwordHash = await bcrypt.hash("pass1234", 10);
    const adminUser = await db.user.create({
      data: {
        firstName: "Admin",
        lastName: "User",
        email: "admin@email.com",
        password: passwordHash,
        isAdmin: true,
      },
    });
    console.log(`created Admin user: ${adminUser.email}`);

    const regularUsersData = Array.from({ length: 2 }).map((item) => {
      return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        password: passwordHash,
        isAdmin: false,
      };
    });
    const regularUsers = await db.user.createManyAndReturn({
      data: regularUsersData,
    });
    regularUsers.map((user) => {
      console.log(`created regular user: ${user.email}`);
    });

    console.log(`created All regular users...`);
    // create 3 posts from admin user

    const postsContentData = Array.from({ length: 3 }).map((_) => {
      const title = faker.lorem.sentence();
      const slug = slugify(title, { lower: true });
      return {
        title: title,
        content: faker.lorem.paragraph({ min: 3, max: 8 }),
        published: true,
        authorId: adminUser.id,
        slug: slug,
      };
    });
    const postCreationRes = await db.post.createMany({
      data: postsContentData,
    });
    console.log(`created ${postCreationRes.count} posts`);

    const publishedPosts = await db.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
      },
    });

    const commentsToBeMade: {
      content: string;
      authorId: string;
      postId: number;
    }[] = [];
    for (let post of publishedPosts) {
      for (let user of regularUsers) {
        for (let i = 0; i < 3; i++) {
          const comment = {
            content: faker.lorem.sentences({ min: 1, max: 3 }),
            authorId: user.id,
            postId: post.id,
          };
          commentsToBeMade.push(comment);
        }
      }
    }
    const commentsCreatedRes = await db.comment.createMany({
      data: commentsToBeMade,
    });
    console.log(`created ${commentsCreatedRes.count} comments...`);
    console.log("Finished populating DB");
    await db.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  }
  // for each post, have the 2 users leave 3 comments on each post
}

main();
