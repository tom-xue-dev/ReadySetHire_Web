-- Rename INTERVIEWER to EMPLOYEE in UserRole enum

-- Step 1: Drop the default constraint temporarily
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Create new enum with desired values
CREATE TYPE "public"."UserRole_new" AS ENUM ('ADMIN', 'RECRUITER', 'EMPLOYEE');

-- Step 3: Update column to use new enum, converting INTERVIEWER to EMPLOYEE
ALTER TABLE "public"."users" 
  ALTER COLUMN "role" TYPE "public"."UserRole_new" 
  USING (
    CASE 
      WHEN "role"::text = 'INTERVIEWER' THEN 'EMPLOYEE'::text
      ELSE "role"::text
    END
  )::"public"."UserRole_new";

-- Step 4: Drop old enum and rename new one
DROP TYPE "public"."UserRole";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";

-- Step 5: Restore the default value
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'RECRUITER'::"public"."UserRole";
