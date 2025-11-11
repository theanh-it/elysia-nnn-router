import { z } from "zod";
import type { RouteContext, UserId, PostId } from "../../../../src/types";
import { brand } from "../../../../src/types";

export const schema = {
  body: z.object({
    userId: z.string(),
    postId: z.string(),
    action: z.enum(["like", "share", "comment"]),
  }),
  detail: {
    summary: "Branded Types Demo",
    description:
      "Demonstrates type-safe IDs using branded types.\n\n" +
      "**Branded types prevent ID mixing at compile-time:**\n" +
      "- `UserId` and `PostId` are distinct types\n" +
      "- Cannot accidentally pass wrong ID to function\n" +
      "- TypeScript catches bugs before runtime\n\n" +
      "**Try it:**\n" +
      '```json\n{ "userId": "user-123", "postId": "post-456", "action": "like" }\n```',
    tags: ["Type Safety"],
  },
};

// Type-safe helper functions with branded types
function getUserName(userId: UserId): string {
  // In real app, fetch from database
  return `User ${userId}`;
}

function getPostTitle(postId: PostId): string {
  // In real app, fetch from database
  return `Post ${postId}`;
}

// This function only accepts UserId, NOT PostId
function logUserAction(userId: UserId, action: string) {
  console.log(`User ${userId} performed action: ${action}`);
}

export default async (ctx: RouteContext<typeof schema>) => {
  const { userId: userIdStr, postId: postIdStr, action } = ctx.body;

  // Create branded types from strings
  const userId = brand<string, "UserId">(userIdStr);
  const postId = brand<string, "PostId">(postIdStr);

  // ✅ Type-safe: These work because types match
  const userName = getUserName(userId);
  const postTitle = getPostTitle(postId);
  logUserAction(userId, action);

  // ❌ These would be TypeScript errors (caught at compile-time):
  // getUserName(postId);  // Error: PostId is not UserId!
  // getPostTitle(userId); // Error: UserId is not PostId!
  // logUserAction(postId, action); // Error: PostId is not UserId!

  return {
    success: true,
    message: "Branded types ensure type safety!",
    data: {
      user: {
        id: userId,
        name: userName,
        type: "UserId (branded)",
      },
      post: {
        id: postId,
        title: postTitle,
        type: "PostId (branded)",
      },
      action,
    },
    typeSafety: {
      explanation:
        "userId and postId are now distinct types at compile-time",
      benefit: "TypeScript prevents passing wrong ID to functions",
      runtime: "No overhead - types are erased at runtime",
    },
    example: {
      code: `
// Creating branded types
const userId = brand<string, "UserId">("user-123");
const postId = brand<string, "PostId">("post-456");

// Type-safe function calls
getUserName(userId);   // ✅ Works
getUserName(postId);   // ❌ Compile error!
      `.trim(),
    },
  };
};

