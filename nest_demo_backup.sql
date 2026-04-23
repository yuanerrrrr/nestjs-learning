--
-- PostgreSQL database dump
--

\restrict kWa2msgceO2EOU70QbTTg6HC9egcdagnB3eWmXneZfNYROW7poTLlTEn6rHMobB

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tasks_status_enum; Type: TYPE; Schema: public; Owner: lisiyuan04
--

CREATE TYPE public.tasks_status_enum AS ENUM (
    'pending',
    'in-progress',
    'completed'
);


ALTER TYPE public.tasks_status_enum OWNER TO lisiyuan04;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: lisiyuan04
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    status public.tasks_status_enum DEFAULT 'pending'::public.tasks_status_enum NOT NULL,
    "dueDate" timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    "userId" integer
);


ALTER TABLE public.tasks OWNER TO lisiyuan04;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: lisiyuan04
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO lisiyuan04;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lisiyuan04
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lisiyuan04
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    age integer DEFAULT 0 NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO lisiyuan04;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: lisiyuan04
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO lisiyuan04;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lisiyuan04
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: lisiyuan04
--

COPY public.tasks (id, title, description, status, "dueDate", created_at, updated_at, "userId") FROM stdin;
3	学习前端	完成VUE学习	pending	2026-04-21 00:00:00	2026-04-20 17:06:39.290191	2026-04-20 17:06:39.290191	9
4	学习前端	完成JavaScript学习	pending	2026-04-21 00:00:00	2026-04-20 17:06:55.079388	2026-04-20 17:06:55.079388	9
2	学习前端	完成JavaScript学习	completed	2026-04-20 00:00:00	2026-04-20 17:06:24.273672	2026-04-20 17:09:33.437575	9
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: lisiyuan04
--

COPY public.users (id, name, age, email, password, created_at, updated_at) FROM stdin;
1	王五	22	wangwu@test.com	12345678	2026-04-14 20:06:16.368712	2026-04-14 20:06:16.368712
3	李四	23	lisi@test.com	12345678	2026-04-14 20:06:48.114212	2026-04-14 20:06:48.114212
5	钱一	25	qianyi@test.com	12345678	2026-04-14 20:07:22.314784	2026-04-14 20:07:22.314784
2	张三	30	zhangsan@test.com	12345678	2026-04-14 20:06:36.940098	2026-04-14 20:28:03.759762
6	刘艳	30	liuyan@test.com	$2b$10$OMzpcq4g3sVeuIO/gUC7peLUj8uC5UHQiYqDjWWkBHd6GMT2SBSP.	2026-04-19 19:15:05.573439	2026-04-19 19:15:05.573439
7	测试用户1	20	ceshi1@test.com	$2b$10$h5n9IqYn.BO6ayU64K87seh8EXE6h.lUds2BPs47Furf1JP21CE5G	2026-04-19 21:22:43.206628	2026-04-19 21:22:43.206628
8	测试用户2	20	ceshi2@test.com	$2b$10$eV5thqYthSTWRNK.qlPQZuVhuzF.tCo3TFaEmzDG2b.84S4RHrWz2	2026-04-19 23:11:41.217085	2026-04-19 23:11:41.217085
9	张悦	20	zhangyue@test.com	$2b$10$nA84FdTJXkLwgJ4hE4C69uYj6glomB8zID77/6otfNrAuEtdrtr9a	2026-04-20 17:03:26.54009	2026-04-20 17:03:26.54009
10	王一	20	wangyi@test.com	$2b$10$CTY.pDKp.EyZxp9iLpLsWOjkp5um6KnS8v02Ik/kDJzGIxmuywYjm	2026-04-20 17:13:37.192864	2026-04-20 17:13:37.192864
\.


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lisiyuan04
--

SELECT pg_catalog.setval('public.tasks_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: lisiyuan04
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: tasks PK_8d12ff38fcc62aaba2cab748772; Type: CONSTRAINT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: tasks FK_166bd96559cb38595d392f75a35; Type: FK CONSTRAINT; Schema: public; Owner: lisiyuan04
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict kWa2msgceO2EOU70QbTTg6HC9egcdagnB3eWmXneZfNYROW7poTLlTEn6rHMobB

