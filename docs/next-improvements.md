Possible points of improvements of the application

## Data reprocessing
The current dataset (roughly a 100 articles) was processed using LLMs without native structured output, it simply requested the LLM to give a JSON back. 
That led to data not having the correct content or desired output structure.
- Suggestion: reprocess the data (Google Docs files) with models that natively support structured output.
- Objective: Have a 1:1 match of what's written in the google docs file vs what's available in the wiki website.

## Improve the search algorithm
Currently, searching for articles relies on the pg_trgm extension only and it doesn't perform well against any kind of popular search mechanism as benchmark.
- Objective: have a search mechanism that will work similarly to other wiki websites.
- Additional information: pg_trgm in the backend right now has a worst performance than using Levenshtein distance. 
The caveat of such approach is that it would require all articles to be fetched, whereas pg_trgm makes use of existing indexes to speed up searches and minimize database query cost (important for managed database hosting like Supabase).

## Create a submission system for new articles
Definitely the most complex one in this list, this is reasonable to be done in a short amount of time (up to three months) if very well-planned and with a high usage of AI tools to write code and test suites.
The idea is to go away from the flow A to the flow B.
Flow A:
1. Feedback loop between researcher and professors until an article is in good shape.
2. Professor writes the articles in a Google Drive folder.
3. An engineer gets the article and, somehow (manually or via written scripts), make it available in the database and, therefore, in the wiki website.

Flow B:
1. Researcher creates a new article submission in the Trânsitos | Circulations website.
2. A professor gets a notification / manually check an admin panel, see the submission and review it.
3. Researcher sees the review, change the submission accordingly and sends back to review again.
4. Suppose the article is good enough: Professor approves it.
5. The system automatically makes the article visible in the website and available for public access.