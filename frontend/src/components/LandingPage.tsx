import { Button, Center, UnorderedList, ListItem, VStack, Box, Flex, Text, Divider, Link, Tooltip, Input } from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { QuestionOutlineIcon, QuestionIcon } from "@chakra-ui/icons";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { set } from "firebase/database";

function LandingPage({
  setNickname,
  nickname,
  setNicknameSet,
}: {
  setNickname: (arg0: string) => void;
  nickname: string;
  setNicknameSet: (arg0: boolean) => void;
}) {
  const { login, authenticated, ready, user } = usePrivy();
  const [subPage, setSubPage] = useState("nickname");

  useEffect(() => {
    if (ready && authenticated && user?.email?.address) {
      setSubPage("nickname");
    } else {
      setSubPage("info");
    }
  }, [authenticated, ready, user]);

  return (
    <VStack backgroundColor={"white"} padding={"16px"} height={"100%"} borderRadius={"3xl"} justifyContent={"space-between"}>
      {subPage === "info" && (
        <Flex direction={"column"} height={"100%"}>
          <Box height={"100%"}>
            <Text fontWeight={"bold"} fontSize={"2xl"} mb={"5px"}>
              Interac e-Transfer 💸
            </Text>
            <Text fontWeight={"semibold"} fontSize={"xl"} mb={"15px"}>
              Solid Financial Infrastructure for Everyone{" "}
              <Tooltip label="e-Transfer is the solution to depreciating currencies and unstable financial infrastructure in developing countries.">
                <QuestionOutlineIcon color={"gray.400"} ml={"5px"} boxSize={4} />
              </Tooltip>
            </Text>

            <UnorderedList spacing={4}>
              <ListItem>
                <Text fontSize={"xl"} fontWeight={"semibold"}>
                  Send money instantly to <i>any</i> e-mail 📧
                </Text>
              </ListItem>
              <ListItem>
                <Text fontSize={"xl"} fontWeight={"semibold"}>
                  Works with your bank account or crypto wallet 🏦
                </Text>
              </ListItem>
              <ListItem>
                <Text fontSize={"xl"} fontWeight={"semibold"}>
                  As easy as{" "}
                  <Link href="https://www.zellepay.com/" isExternal>
                    Zelle↗.
                  </Link>{" "}
                  The new standard of user-friendly Web3 UX ✨
                </Text>
              </ListItem>
              <ListItem>
                <Text fontSize={"xl"} fontWeight={"semibold"}>
                  Sign up now and get $5, on us 🤑
                </Text>
              </ListItem>
            </UnorderedList>
          </Box>

          <Flex w="100%" direction={"column"} gap={"10px"}>
            <Center>
              <Text fontSize={"sm"} color={"gray.400"}>
                What are you waiting for?
              </Text>
            </Center>
            <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" />
            <Button onClick={login}>Login</Button>
            <Center>
              <Text fontSize={"sm"} color={"gray.400"}>
                <Link isExternal textDecor={"underline"} href="https://github.com/xavierdmello/e-Transfer">
                  Github
                </Link>{" "}
                - © 2023{" "}
                <Link href="https://xavierdmello.com" textDecor={"underline"} isExternal>
                  Xavier D'Mello ↗
                </Link>
              </Text>
            </Center>
          </Flex>
        </Flex>
      )}

      {subPage === "nickname" && (
        <Flex direction={"column"} height={"100%"} justifyContent={"space-between"}>
          <Flex direction={"column"}>
            <Text fontWeight={"bold"} fontSize={"2xl"} mb={"5px"}>
              What's your name? 💭
            </Text>
            <Text fontWeight={"regular"} fontSize={"lg"} mb={"15px"}>
              Your name will be displayed on outgoing e-Transfers.
            </Text>
            <Flex direction={"row"} gap={"8px"}>
              <Input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)}></Input>
              <Button colorScheme="brand" onClick={() => setNicknameSet(true)}>
                <ArrowForwardIcon color={"black"} />
              </Button>
            </Flex>
          </Flex>

          <Flex w="100%" direction={"column"} gap={"10px"}>
            <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" />

            <Center>
              <Text fontSize={"sm"} color={"gray.400"}>
                <Link isExternal textDecor={"underline"} href="https://github.com/xavierdmello/e-Transfer">
                  Github
                </Link>{" "}
                - © 2023{" "}
                <Link href="https://xavierdmello.com" textDecor={"underline"} isExternal>
                  Xavier D'Mello ↗
                </Link>
              </Text>
            </Center>
          </Flex>
        </Flex>
      )}
    </VStack>
  );
}

export default LandingPage;
