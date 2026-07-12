import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { textToSpeech } from "./_core/tts_service";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tts: router({
    synthesize: publicProcedure
      .input(
        z.object({
          text: z.string(),
          language: z.enum(["en-US", "hi-IN", "te-IN", "ta-IN"]),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const audioUrl = await textToSpeech(input.text, input.language);
          return { success: true, audioUrl };
        } catch (error) {
          console.error("TTS error:", error);
          return { success: false, error: "Failed to synthesize speech" };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
