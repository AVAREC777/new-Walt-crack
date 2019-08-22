import React, { useEffect } from "react";
import Router from "next/router";
import { StatusIcon } from "./StatusIcon";
import styled from "styled-components";
import ReactTimeAgo from "react-time-ago";
import { IBuild, IBuildDetails, getBuildDetails } from "../utils/api";
import { LogsContainer } from "./LogsContainer";
import { secondsToCounter } from "../utils/countdown";
import { Countdown } from "./Countdown";
import { SandboxList } from "./SandboxList";

const Container = styled.div`
  overflow-y: auto;
  height: 100%;
`;

const BuildDetails = styled.div`
  margin-top: 1.5rem;
`;

const TitleContainer = styled.div`
  display: flex;
`;

const Title = styled.h1`
  font-weight: 400;
  font-size: 1rem;
  margin: 0;
  margin-bottom: 0.25rem;
`;

const Description = styled.div`
  font-weight: 400;
  font-size: 1rem;
  margin: 0;
  margin-bottom: 0;
  font-size: 0.75rem;
  line-height: 1.25rem;
  color: ${props => props.theme.gray};
`;

const StyledTimeAgo = styled(ReactTimeAgo)`
  color: ${props => props.theme.gray};
`;

const Link = styled.a.attrs({ target: "_blank", rel: "noreferrer noopener" })`
  transition: 0.3s ease color;
  color: rgba(255, 255, 255, 0.8);

  text-decoration: none;

  &:hover {
    color: white;
  }
`;

interface Props {
  username: string;
  repo: string;
  prNumber: number;
  build: IBuild;
}

export const BuildInfo = ({ username, repo, prNumber, build }: Props) => {
  const [buildDetails, setBuildDetails] = React.useState<IBuildDetails>();

  const fetchBuildDetails = async () => {
    const res = await getBuildDetails(username, repo, prNumber, build.id);

    if (
      buildDetails &&
      res.build.status !== buildDetails.status &&
      (buildDetails.status === "queued" || buildDetails.status === "running")
    ) {
      // Refresh the whole ui as the build has changed its status
      Router.replace(document.location.pathname);
    }

    setBuildDetails(res.build);
  };

  useEffect(() => {
    fetchBuildDetails();

    return () => {
      setBuildDetails(undefined);
    };
  }, [username, repo, prNumber, build.id, build.status]);

  useEffect(() => {
    function tick() {
      // @ts-ignore
      if (build.status === "running" || build.status === "queued") {
        fetchBuildDetails();
      }
    }

    let id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [username, repo, prNumber, build.id, build.status]);

  const usedBuild = buildDetails || build;

  return (
    <Container>
      <TitleContainer>
        <StatusIcon
          style={{ marginRight: ".5rem", marginTop: ".1875rem" }}
          status={usedBuild.status}
        />

        <div>
          <Title>
            {username}/{repo}
            &nbsp;&nbsp;&nbsp;&nbsp;
            {`#${usedBuild.id}`}
          </Title>

          <Description>
            {usedBuild.status === "queued" ? (
              `Queued`
            ) : (
              <>
                Started <StyledTimeAgo date={+new Date(usedBuild.startedAt)} />{" "}
                •{" "}
                {build.status === "running" ? (
                  <Countdown startedAt={+new Date(usedBuild.startedAt)} />
                ) : (
                  secondsToCounter(Math.floor(usedBuild.duration / 1000))
                )}
              </>
            )}
            <br />
            <Link href={`https://github.com/${usedBuild.commitAuthor}`}>
              {usedBuild.commitAuthor}
            </Link>{" "}
            opened pull request{" "}
            <Link
              href={`https://github.com/${username}/${repo}/pulls/${prNumber}`}
            >
              #{prNumber}
            </Link>{" "}
            to{" "}
            <Link
              href={`https://github.com/${username}/${repo}/tree/${
                usedBuild.targetBranch
              }`}
            >
              {usedBuild.targetBranch}
            </Link>
          </Description>
        </div>
      </TitleContainer>

      <BuildDetails>
        <SandboxList style={{ marginBottom: "1rem" }} />

        <LogsContainer
          duration={usedBuild.duration}
          status={usedBuild.status}
          log={usedBuild["log"]}
        />
      </BuildDetails>
    </Container>
  );
};
